import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, employees, employeeAccounts, sessions, rolePermissionEntries, roleDefinitions, payrollRecords, auditLogEntries } from "../db/schema.ts";

/**
 * Proves the RBAC-granular rollout (security review, user 2026-11-10:
 * "RBAC granular Harus diselesaikan") is real enforcement, not decorative —
 * an employee-role account with a custom roleKey and NO permission row for
 * a module must be rejected, and the exact same account must succeed the
 * instant (and only once) a tenant_admin grants that permission through the
 * real /rbac-permissions endpoint. Real DB, no mocks, per
 * testing-standards.md rule 5.
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "rbactest-tenant";
const ADMIN_EMAIL = "admin@rbactest.local";
const ADMIN_PASSWORD = "ChangeMe123!";
const STAFF_EMAIL = "staff@rbactest.local";
const STAFF_PASSWORD = "ChangeMe123!";
const STAFF_ROLE_KEY = "finance_test_role";

const origin = `http://${SUBDOMAIN}.${baseDomain}`;

let tenantId: string;
let entityId: string;
let employeeId: string;
let employeeAccountId: string;
let adminAgent: ReturnType<typeof request.agent>;
let staffAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "RBAC Test Tenant", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "RBAC Test Admin", email: ADMIN_EMAIL, passwordHash: adminPasswordHash });

  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "RBAC Test Co", code: "RBACTEST" }).returning();
  entityId = entity.id;

  const [employee] = await db.insert(employees).values({ tenantId, entityId, nik: "RBAC-0001", fullName: "Staff Finance Test" }).returning();
  employeeId = employee.id;

  const staffPasswordHash = await bcrypt.hash(STAFF_PASSWORD, 10);
  const [account] = await db
    .insert(employeeAccounts)
    .values({ tenantId, employeeId, email: STAFF_EMAIL, passwordHash: staffPasswordHash, roleKey: STAFF_ROLE_KEY })
    .returning();
  employeeAccountId = account.id;

  adminAgent = withCsrf(request.agent(app));
  const adminLogin = await adminAgent.post("/api/auth/login").set("Origin", origin).send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(adminLogin.status).toBe(200);

  staffAgent = withCsrf(request.agent(app));
  const staffLogin = await staffAgent.post("/api/employee/login").set("Origin", origin).send({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  expect(staffLogin.status).toBe(200);
});

afterAll(async () => {
  await db.delete(rolePermissionEntries).where(eq(rolePermissionEntries.tenantId, tenantId));
  await db.delete(roleDefinitions).where(eq(roleDefinitions.tenantId, tenantId));
  await db.delete(payrollRecords).where(eq(payrollRecords.tenantId, tenantId));
  await db.delete(employeeAccounts).where(eq(employeeAccounts.tenantId, tenantId));
  await db.delete(employees).where(eq(employees.tenantId, tenantId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("RBAC granular enforcement — employee module access is real, not decorative", () => {
  it("a custom-role employee account with no permission row is rejected from a gated module", async () => {
    const res = await staffAgent.get("/api/employee/payroll-records").set("Origin", origin);
    expect(res.status).toBe(403);
  });

  it("a tenant_admin session is never permission-restricted (always full access by design)", async () => {
    const res = await adminAgent.get("/api/tenant/payroll-records").set("Origin", origin);
    expect(res.status).toBe(200);
  });

  it("granting the module permission through the real RBAC endpoint immediately unlocks the same route for that role", async () => {
    const grant = await adminAgent
      .put(`/api/tenant/rbac-permissions/payroll/${STAFF_ROLE_KEY}`)
      .set("Origin", origin)
      .send({ view: true, create: false, edit: false, delete: false, approve: false, export: false });
    expect(grant.status).toBe(201);

    const res = await staffAgent.get("/api/employee/payroll-records").set("Origin", origin);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("the granted view permission does NOT imply create — the matrix is per-action, not all-or-nothing", async () => {
    const res = await staffAgent
      .post("/api/employee/payroll-records/upsert")
      .set("Origin", origin)
      .send({ employeeId, period: "2026-11" });
    expect(res.status).toBe(403);
  });
});
