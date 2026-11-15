import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { hashToken } from "../lib/token.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, employees, employeeAccounts, employeeAccountTokens, sessions, auditLogEntries, rolePermissionEntries, roleDefinitions } from "../db/schema.ts";

// NOTE: authLimiter allows 10 calls per 15 min per process; this file deliberately stays under it.
/** No temporary passwords: an account is born with an unknown password and a one-time link the employee uses to set their own. */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "activation-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
const NEW_PASSWORD = "Zq7!vN2#mK9pLxRt";

let tenantId: string;
let entityId: string;
let empId: string;
let accountId: string;
let admin: ReturnType<typeof request.agent>;
let activationToken: string;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Activation Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Act Admin", email: "admin@activation.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Act Co", code: "ACTTEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });
  const [emp] = await db.insert(employees).values({ tenantId, entityId, nik: "ACT-1", fullName: "Karyawan Aktivasi" }).returning();
  empId = emp.id;
  admin = withCsrf(request.agent(app));
  expect((await admin.post("/api/auth/login").set("Origin", origin).send({ email: "admin@activation.local", password: "ChangeMe123!" })).status).toBe(200);
});

afterAll(async () => {
  const accs = await db.select({ id: employeeAccounts.id }).from(employeeAccounts).where(eq(employeeAccounts.tenantId, tenantId));
  for (const a of accs) await db.delete(employeeAccountTokens).where(eq(employeeAccountTokens.employeeAccountId, a.id));
  await db.delete(employeeAccounts).where(eq(employeeAccounts.tenantId, tenantId));
  await db.delete(rolePermissionEntries).where(eq(rolePermissionEntries.tenantId, tenantId));
  await db.delete(roleDefinitions).where(eq(roleDefinitions.tenantId, tenantId));
  await db.delete(employees).where(eq(employees.tenantId, tenantId));
  await db.delete(entityClosure).where(eq(entityClosure.ancestorEntityId, entityId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("employee account provisioning without temporary passwords", () => {
  it("provisioning takes no password, returns none, and hands the admin a one-time link only when no mail was delivered", async () => {
    const res = await admin.post("/api/tenant/employee-accounts").set("Origin", origin).send({ employeeId: empId, email: "karyawan@activation.local", roleKey: "employee", password: "Dikirim123!" });
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    expect(res.body.delivery).toBe("manual"); // no mailer in the test environment
    expect(res.body.activationLink).toContain("/activate/");
    accountId = res.body.account.id;
    activationToken = res.body.activationLink.split("/activate/")[1];

    // The password the admin tried to send was ignored; the account has no known password.
    const staff = withCsrf(request.agent(app));
    expect((await staff.post("/api/employee/login").set("Origin", origin).send({ email: "karyawan@activation.local", password: "Dikirim123!" })).status).toBe(401);

    // Same employee cannot be provisioned twice.
    const dup = await admin.post("/api/tenant/employee-accounts").set("Origin", origin).send({ employeeId: empId, email: "lain@activation.local" });
    expect(dup.status).toBe(400);
  });

  it("the stored token is hashed; the link sets the password once, and the employee can then log in", async () => {
    const [stored] = await db.select().from(employeeAccountTokens).where(eq(employeeAccountTokens.employeeAccountId, accountId));
    expect(stored.tokenHash).toBe(hashToken(activationToken));
    expect(stored.tokenHash).not.toBe(activationToken);

    const anon = withCsrf(request.agent(app));
    const ok = await anon.post(`/api/employee/activate/${activationToken}`).set("Origin", origin).send({ newPassword: NEW_PASSWORD });
    expect(ok.status).toBe(200);

    const staff = withCsrf(request.agent(app));
    expect((await staff.post("/api/employee/login").set("Origin", origin).send({ email: "karyawan@activation.local", password: NEW_PASSWORD })).status).toBe(200);

    const reuse = await anon.post(`/api/employee/activate/${activationToken}`).set("Origin", origin).send({ newPassword: "An0ther!Strong#Pass1" });
    expect(reuse.status).toBe(400);
  });

  it("an expired or unknown link is refused", async () => {
    const { generateToken } = await import("../lib/token.ts");
    const { token, tokenHash } = generateToken();
    await db.insert(employeeAccountTokens).values({ employeeAccountId: accountId, purpose: "reset", tokenHash, expiresAt: new Date(Date.now() - 1000) });
    const anon = withCsrf(request.agent(app));
    expect((await anon.post(`/api/employee/activate/${token}`).set("Origin", origin).send({ newPassword: "An0ther!Strong#Pass1" })).status).toBe(400);
  });

  it("forgot-password never reveals whether an account exists; admin can issue a reset link; the password field on update is gone", async () => {
    const anon = withCsrf(request.agent(app));
    const unknown = await anon.post("/api/employee/forgot-password").set("Origin", origin).send({ email: "tidak.ada@activation.local" });
    expect(unknown.status).toBe(200);
    const before = await db.select().from(employeeAccountTokens).where(eq(employeeAccountTokens.employeeAccountId, accountId));
    const known = await anon.post("/api/employee/forgot-password").set("Origin", origin).send({ email: "karyawan@activation.local" });
    expect(known.status).toBe(200);
    const after = await db.select().from(employeeAccountTokens).where(eq(employeeAccountTokens.employeeAccountId, accountId));
    expect(after.length).toBe(before.length + 1);

    const reset = await admin.post(`/api/tenant/employee-accounts/${accountId}/send-reset`).set("Origin", origin);
    expect(reset.status).toBe(200);
    expect(reset.body.resetLink).toContain("/activate/");

    const put = await admin.put(`/api/tenant/employee-accounts/${accountId}`).set("Origin", origin).send({ password: "Dipaksa123!Abc", roleKey: "manager" });
    expect(put.status).toBe(200);
    const staff = withCsrf(request.agent(app));
    // If the password field had been applied, the real password would no longer work.
    expect((await staff.post("/api/employee/login").set("Origin", origin).send({ email: "karyawan@activation.local", password: NEW_PASSWORD })).status).toBe(200);
  });
});
