import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { applyDuePersonaliaActions } from "../lib/personalia.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, employees, sessions, auditLogEntries, officialDocuments, orgStructureNodes, personaliaActions, approvalItems, complianceRecords } from "../db/schema.ts";

/**
 * Personalia end-to-end: an action is created with a server-captured
 * "previous" snapshot, routed through the Approval Engine (approver =
 * employee's real manager), and ONLY on final approval does the server
 * change the employee, the org-chart seat, the reporting line and issue the
 * SK with no QR until signed. Real DB, no mocks.
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "personalia-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
const PASSWORD = "ChangeMe123!";

let tenantId: string;
let entityId: string;
let adminAgent: ReturnType<typeof request.agent>;
let staffId: string;
let managerId: string;
let nodeOld: string;
let nodeNew: string;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Personalia Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Personalia Admin", email: "admin@personalia.local", passwordHash: await bcrypt.hash(PASSWORD, 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Personalia Co", code: "PRSTEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });

  const [head] = await db.insert(orgStructureNodes).values({ tenantId, entityId, title: "Kepala Divisi", isVacant: false, level: 1 }).returning();
  const [oldN] = await db.insert(orgStructureNodes).values({ tenantId, entityId, title: "Staf", reportsToId: head.id, isVacant: false, level: 2 }).returning();
  const [newN] = await db.insert(orgStructureNodes).values({ tenantId, entityId, title: "Supervisor", reportsToId: head.id, isVacant: true, level: 2, jobGrade: "G4" }).returning();
  nodeOld = oldN.id;
  nodeNew = newN.id;
  const [mgr] = await db.insert(employees).values({ tenantId, entityId, nik: "PRS-M", fullName: "Manajer", orgNodeId: head.id }).returning();
  managerId = mgr.id;
  const [staff] = await db.insert(employees).values({ tenantId, entityId, nik: "PRS-S", fullName: "Staf Uji", orgNodeId: oldN.id, managerId, basicSalary: 5_000_000, details: { position: "Staf", grade: "G3" } }).returning();
  staffId = staff.id;

  adminAgent = withCsrf(request.agent(app));
  const login = await adminAgent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@personalia.local", password: PASSWORD });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(complianceRecords).where(eq(complianceRecords.tenantId, tenantId));
  await db.delete(officialDocuments).where(eq(officialDocuments.tenantId, tenantId));
  await db.delete(personaliaActions).where(eq(personaliaActions.tenantId, tenantId));
  await db.delete(approvalItems).where(eq(approvalItems.tenantId, tenantId));
  await db.update(employees).set({ managerId: null, orgNodeId: null }).where(eq(employees.tenantId, tenantId));
  await db.delete(employees).where(eq(employees.tenantId, tenantId));
  await db.update(orgStructureNodes).set({ reportsToId: null }).where(eq(orgStructureNodes.tenantId, tenantId));
  await db.delete(orgStructureNodes).where(eq(orgStructureNodes.tenantId, tenantId));
  await db.delete(entityClosure).where(eq(entityClosure.ancestorEntityId, entityId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("Personalia end-to-end", () => {
  let actionId: string;
  let approvalId: string;

  it("promotion: creation snapshots the employee server-side and submits to the engine without touching the employee", async () => {
    const res = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({
      employeeId: staffId,
      type: "Promosi",
      newOrgNodeId: nodeNew,
      newGrade: "G4",
      newSalary: 7_000_000,
      effectiveDate: "2026-11-01",
      reason: "Kinerja unggul",
      previousSalary: 999, // ignored: server snapshot wins
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Menunggu Approval");
    expect(res.body.previousSalary).toBe(5_000_000);
    expect(res.body.previousPosition).toBe("Staf");
    expect(res.body.previousOrgNodeId).toBe(nodeOld);
    actionId = res.body.id;
    approvalId = res.body.approvalItemId;
    expect(approvalId).toBeTruthy();

    const [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(5_000_000);
    expect(emp.orgNodeId).toBe(nodeOld);
  });

  it("rejects a promotion to a missing seat, and a duplicate letter number", async () => {
    const bad = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Promosi", effectiveDate: "2026-11-01", reason: "tanpa posisi" });
    expect(bad.status).toBe(400);
    const dup = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Penyesuaian Gaji", newSalary: 6_000_000, effectiveDate: "2026-11-01", reason: "gaji", letterNumber: "DUP-1", status: "Draf" });
    expect(dup.status).toBe(201);
    const dup2 = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Penyesuaian Gaji", newSalary: 6_000_000, effectiveDate: "2026-11-01", reason: "gaji", letterNumber: "DUP-1", status: "Draf" });
    expect(dup2.status).toBe(400);
    await adminAgent.delete(`/api/tenant/personalia-actions/${dup.body.id}`).set("Origin", origin).expect(204);
  });

  it("approving applies it: salary, position, org seat swap, manager, and an SK without QR", async () => {
    const decide = await adminAgent.post(`/api/tenant/approval-items/${approvalId}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(decide.status).toBe(200);
    expect(decide.body.status).toBe("Disetujui");

    const [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(7_000_000);
    expect(emp.orgNodeId).toBe(nodeNew);
    expect(emp.managerId).toBe(managerId);
    expect((emp.details as Record<string, unknown>).position).toBe("Supervisor");
    expect((emp.details as Record<string, unknown>).grade).toBe("G4");

    const [oldNode] = await db.select().from(orgStructureNodes).where(eq(orgStructureNodes.id, nodeOld));
    const [newNode] = await db.select().from(orgStructureNodes).where(eq(orgStructureNodes.id, nodeNew));
    expect(oldNode.isVacant).toBe(true);
    expect(newNode.isVacant).toBe(false);

    const [action] = await db.select().from(personaliaActions).where(eq(personaliaActions.id, actionId));
    expect(action.status).toBe("Disetujui");
    expect(action.appliedAt).not.toBeNull();
    expect(action.documentId).toBeTruthy();
    const [doc] = await db.select().from(officialDocuments).where(eq(officialDocuments.id, action.documentId!));
    expect(doc.status).toBe("Menunggu Tanda Tangan");
    expect(doc.qrVerificationUrl).toBeNull();
  });

  it("a rejected action never changes the employee; SP approval creates a compliance record", async () => {
    const rej = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Penyesuaian Gaji", newSalary: 9_000_000, effectiveDate: "2026-11-01", reason: "ditolak uji" });
    expect(rej.status).toBe(201);
    const r = await adminAgent.post(`/api/tenant/approval-items/${rej.body.approvalItemId}/decision`).set("Origin", origin).send({ decision: "Ditolak", reason: "tidak sesuai anggaran" });
    expect(r.status).toBe(200);
    const [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(7_000_000);
    const [row] = await db.select().from(personaliaActions).where(eq(personaliaActions.id, rej.body.id));
    expect(row.status).toBe("Ditolak");

    const sp = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Sanksi Disiplin SP", disciplinaryLevel: "SP 1", effectiveDate: "2026-11-01", reason: "Pelanggaran jam kerja" });
    expect(sp.status).toBe(201);
    await adminAgent.post(`/api/tenant/approval-items/${sp.body.approvalItemId}/decision`).set("Origin", origin).send({ decision: "Disetujui" }).expect(200);
    const comp = await db.select().from(complianceRecords).where(eq(complianceRecords.employeeId, staffId));
    expect(comp.length).toBe(1);
    expect(comp[0].level).toBe("SP 1");
  });

  it("personal-data SK: every field is validated by its format, protected keys are rejected, valid data is applied on approval", async () => {
    const post = (personalDataUpdates: Record<string, unknown>) =>
      adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Koreksi & Update Data Pribadi", effectiveDate: "2026-11-01", reason: "Koreksi data", personalDataUpdates });
    const badNik = await post({ nikKtp: "123" });
    expect(badNik.status).toBe(400);
    expect(badNik.body.error).toMatch(/NIK KTP/);
    const protectedKey = await post({ basicSalary: 99_000_000 });
    expect(protectedKey.status).toBe(400);
    expect(protectedKey.body.error).toMatch(/basicSalary/);
    const empty = await post({});
    expect(empty.status).toBe(400);

    const ok = await post({ nikKtp: "3201010101010001", bankAccount: "1234567890", phone: "+62 812-3456-7890", birthDate: "1995-05-20" });
    expect(ok.status).toBe(201);
    await adminAgent.post(`/api/tenant/approval-items/${ok.body.approvalItemId}/decision`).set("Origin", origin).send({ decision: "Disetujui" }).expect(200);
    const [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect((emp.details as Record<string, unknown>).nikKtp).toBe("3201010101010001");
    expect(emp.phone).toBe("+62 812-3456-7890");
    expect(emp.basicSalary).toBe(7_000_000);
  });

  it("a future effective date is approved now but only applied once that date arrives", async () => {
    const created = await adminAgent.post("/api/tenant/personalia-actions").set("Origin", origin).send({ employeeId: staffId, type: "Penyesuaian Gaji", newSalary: 8_000_000, effectiveDate: "2099-01-01", reason: "Kenaikan terjadwal" });
    expect(created.status).toBe(201);
    await adminAgent.post(`/api/tenant/approval-items/${created.body.approvalItemId}/decision`).set("Origin", origin).send({ decision: "Disetujui" }).expect(200);

    let [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(7_000_000);
    let [row] = await db.select().from(personaliaActions).where(eq(personaliaActions.id, created.body.id));
    expect(row.status).toBe("Disetujui");
    expect(row.appliedAt).toBeNull();

    await applyDuePersonaliaActions();
    [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(7_000_000); // still not due

    await db.update(personaliaActions).set({ effectiveDate: "2020-01-01" }).where(eq(personaliaActions.id, created.body.id));
    await applyDuePersonaliaActions();
    [emp] = await db.select().from(employees).where(eq(employees.id, staffId));
    expect(emp.basicSalary).toBe(8_000_000);
    [row] = await db.select().from(personaliaActions).where(eq(personaliaActions.id, created.body.id));
    expect(row.appliedAt).not.toBeNull();
  });
});
