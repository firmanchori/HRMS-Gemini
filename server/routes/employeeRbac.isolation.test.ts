import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { employeeKpis, tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, employees, employeeAccounts, sessions, rolePermissionEntries, roleDefinitions, payrollRecords, auditLogEntries, officialDocuments, businessTrips } from "../db/schema.ts";

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
  await db.delete(employeeKpis).where(eq(employeeKpis.tenantId, tenantId));
  await db.update(employees).set({ managerId: null }).where(eq(employees.tenantId, tenantId));
  await db.delete(payrollRecords).where(eq(payrollRecords.tenantId, tenantId));
  await db.delete(officialDocuments).where(eq(officialDocuments.tenantId, tenantId));
  await db.delete(businessTrips).where(eq(businessTrips.tenantId, tenantId));
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

  const grant = (moduleKey: string, perms: Partial<Record<"view" | "create" | "edit" | "delete" | "approve" | "export", boolean>>) =>
    adminAgent
      .put(`/api/tenant/rbac-permissions/${moduleKey}/${STAFF_ROLE_KEY}`)
      .set("Origin", origin)
      .send({ view: false, create: false, edit: false, delete: false, approve: false, export: false, ...perms });

  it("phase 2: employees module is rejected without a grant and unlocked by one", async () => {
    const before = await staffAgent.get("/api/employee/employees").set("Origin", origin);
    expect(before.status).toBe(403);
    expect((await grant("employees", { view: true })).status).toBe(201);
    const after = await staffAgent.get("/api/employee/employees").set("Origin", origin);
    expect(after.status).toBe(200);
    expect(after.body.some((e: { id: string }) => e.id === employeeId)).toBe(true);
  });

  it("phase 2: an unrelated module grant does not leak (trips still 403 with only employees view)", async () => {
    const res = await staffAgent.get("/api/employee/business-trips").set("Origin", origin);
    expect(res.status).toBe(403);
  });

  it("phase 2: documents create does not imply approve — confirming a signatory needs the 'approve' action", async () => {
    expect((await grant("documents", { view: true, create: true })).status).toBe(201);
    const created = await staffAgent.post("/api/employee/documents").set("Origin", origin).send({
      documentNumber: "RBAC-001/SK",
      type: "SK_RBAC_TEST",
      title: "SK RBAC",
      issueDate: "2026-11-10",
      signeeName: "Direktur",
      signeeRole: "Direktur",
      contentPreview: "isi",
      status: "Resmi Diterbitkan",
      qrVerificationUrl: "https://evil.example/qr",
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("Menunggu Tanda Tangan");
    expect(created.body.qrVerificationUrl).toBeNull();

    const denied = await staffAgent.post(`/api/employee/documents/${created.body.id}/signatories/0/confirm`).set("Origin", origin).send({});
    expect(denied.status).toBe(403);

    expect((await grant("documents", { view: true, create: true, approve: true })).status).toBe(200);
    const ok = await staffAgent.post(`/api/employee/documents/${created.body.id}/signatories/0/confirm`).set("Origin", origin).send({});
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("Resmi Diterbitkan");
    expect(ok.body.qrVerificationUrl).toMatch(/^https:\/\/nusahr\.enterprise\/verify/);
  });

  it("phase 2: audit trail is view-only for this tier (no write route exists)", async () => {
    expect((await grant("audit_trail", { view: true })).status).toBe(201);
    const read = await staffAgent.get("/api/employee/audit-trail").set("Origin", origin);
    expect(read.status).toBe(200);
    const write = await staffAgent.post("/api/employee/audit-trail").set("Origin", origin).send({});
    expect([404, 405]).toContain(write.status);
  });

  it("KPI assessment follows the reporting line: not self, not a stranger, yes for the real superior", async () => {
    expect((await grant("kpi", { view: true, create: true, edit: true })).status).toBe(201);
    const kpi = (employeeId: string) => ({ employeeId, period: "2026", quarter: "Q4", evaluatedAt: "2026-11-10", finalScore: 80, metrics: [] });
    const self = await staffAgent.post("/api/employee/employee-kpis/upsert").set("Origin", origin).send(kpi(employeeId));
    expect(self.status).toBe(403);

    const [stranger] = await db.insert(employees).values({ tenantId, entityId, nik: "RBAC-0002", fullName: "Bukan Bawahan" }).returning();
    const denied = await staffAgent.post("/api/employee/employee-kpis/upsert").set("Origin", origin).send(kpi(stranger.id));
    expect(denied.status).toBe(403);

    const [report] = await db.insert(employees).values({ tenantId, entityId, nik: "RBAC-0003", fullName: "Bawahan Langsung", managerId: employeeId }).returning();
    const ok = await staffAgent.post("/api/employee/employee-kpis/upsert").set("Origin", origin).send({ ...kpi(report.id), reviewer: "Dipalsukan" });
    expect(ok.status).toBe(201);
    expect(ok.body.reviewer).toBe("Staff Finance Test"); // reviewer name comes from the session, not the body
  });
});
