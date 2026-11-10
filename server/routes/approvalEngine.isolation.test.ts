import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, sessions, auditLogEntries, companyEntities, employees, approvalItems, approvalWorkflowConfigs, employeeAccounts, approvalDelegations } from "../db/schema.ts";

/** Approval Engine: approvers resolve from the real reporting line, steps can't be skipped, reject needs a reason, client can't self-approve on create. */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "apprtest-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
let tenantId: string;
let requesterId: string;
let managerId: string;
let bossId: string;
let agent: ReturnType<typeof request.agent>;
let mgrAgent: ReturnType<typeof request.agent>;
let reqAgent: ReturnType<typeof request.agent>;
let strangerAgent: ReturnType<typeof request.agent>;
let strangerId: string;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Appr Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Appr Admin", email: "admin@apprtest.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Appr Co", code: "APPR" }).returning();
  const [boss] = await db.insert(employees).values({ tenantId, entityId: entity.id, nik: "A-1", fullName: "Boss" }).returning();
  const [mgr] = await db.insert(employees).values({ tenantId, entityId: entity.id, nik: "A-2", fullName: "Manager", managerId: boss.id }).returning();
  const [req1] = await db.insert(employees).values({ tenantId, entityId: entity.id, nik: "A-3", fullName: "Requester", managerId: mgr.id }).returning();
  bossId = boss.id;
  managerId = mgr.id;
  requesterId = req1.id;
  const [stranger] = await db.insert(employees).values({ tenantId, entityId: entity.id, nik: "A-4", fullName: "Stranger" }).returning();
  strangerId = stranger.id;
  const hash = await bcrypt.hash("ChangeMe123!", 10);
  await db.insert(employeeAccounts).values([
    { tenantId, employeeId: mgr.id, email: "mgr@apprtest.local", passwordHash: hash, roleKey: "manager" },
    { tenantId, employeeId: req1.id, email: "req@apprtest.local", passwordHash: hash, roleKey: "employee" },
    { tenantId, employeeId: stranger.id, email: "stranger@apprtest.local", passwordHash: hash, roleKey: "employee" },
  ]);
  const loginEmp = async (email: string) => {
    const a = withCsrf(request.agent(app));
    const r = await a.post("/api/employee/login").set("Origin", origin).send({ email, password: "ChangeMe123!" });
    expect(r.status).toBe(200);
    return a;
  };
  mgrAgent = await loginEmp("mgr@apprtest.local");
  reqAgent = await loginEmp("req@apprtest.local");
  strangerAgent = await loginEmp("stranger@apprtest.local");
  agent = withCsrf(request.agent(app));
  const login = await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@apprtest.local", password: "ChangeMe123!" });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(approvalDelegations).where(eq(approvalDelegations.tenantId, tenantId));
  await db.delete(approvalItems).where(eq(approvalItems.tenantId, tenantId));
  await db.delete(employeeAccounts).where(eq(employeeAccounts.tenantId, tenantId));
  await db.delete(approvalWorkflowConfigs).where(eq(approvalWorkflowConfigs.tenantId, tenantId));
  await db.delete(employees).where(eq(employees.tenantId, tenantId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

const itemBody = (ref: string) => ({ category: "Pinjaman", referenceId: ref, title: "Pinjaman uji", requesterId, assignedApproverRole: "manager" });

describe("approval engine", () => {
  it("resolves approvers from the real reporting line and ignores client-supplied status/level", async () => {
    const cfg = await agent.put("/api/tenant/approval-workflow-configs/Pinjaman").set("Origin", origin).send({
      steps: [
        { mode: "approve", label: "Atasan Langsung", approverType: "direct_manager", slaHours: 24 },
        { mode: "approve", label: "Atasan dari Atasan", approverType: "manager_of_manager", slaHours: 48 },
      ],
    });
    expect(cfg.status).toBe(200);

    const res = await agent.post("/api/tenant/approval-items").set("Origin", origin).send({ ...itemBody("L-1"), status: "Disetujui", level: 2 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Menunggu");
    expect(res.body.level).toBe(1);
    expect(res.body.totalLevels).toBe(2);
    expect(res.body.steps[0].approverEmployeeId).toBe(managerId);
    expect(res.body.steps[1].approverEmployeeId).toBe(bossId);
    expect(res.body.assignedApproverId).toBe(managerId);
  });

  it("requires a reason to reject, and only completes after every approve step", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-2"));
    const id = created.body.id;

    const noReason = await agent.post(`/api/tenant/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Ditolak" });
    expect(noReason.status).toBe(400);

    const first = await agent.post(`/api/tenant/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(first.body.status).toBe("Menunggu");
    expect(first.body.level).toBe(2);
    expect(first.body.assignedApproverId).toBe(bossId);

    const second = await agent.post(`/api/tenant/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(second.body.status).toBe("Disetujui");
    expect(second.body.history).toHaveLength(2);

    const again = await agent.post(`/api/tenant/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(again.status).toBe(400);
  });

  it("a rejection stores the reason and ends the chain", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-3"));
    const res = await agent.post(`/api/tenant/approval-items/${created.body.id}/decision`).set("Origin", origin).send({ decision: "Ditolak", reason: "Plafon melebihi batas" });
    expect(res.body.status).toBe("Ditolak");
    expect(res.body.rejectionReason).toBe("Plafon melebihi batas");
  });

  it("a pending item past its SLA deadline reads back as Eskalasi Terlambat", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-4"));
    const past = created.body.steps.map((s: { deadlineAt: string }) => ({ ...s, deadlineAt: new Date(Date.now() - 3600_000).toISOString() }));
    await db.update(approvalItems).set({ steps: past }).where(eq(approvalItems.id, created.body.id));
    const list = await agent.get("/api/tenant/approval-items").set("Origin", origin);
    const found = list.body.find((i: { id: string }) => i.id === created.body.id);
    expect(found.status).toBe("Eskalasi Terlambat");
  });

  it("only the current step's real approver can decide; requester and strangers are refused", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-5"));
    const id = created.body.id;
    const self = await reqAgent.post(`/api/employee/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(self.status).toBe(403);
    const stranger = await strangerAgent.post(`/api/employee/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(stranger.status).toBe(403);
    const boss = await mgrAgent.post(`/api/employee/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(boss.status).toBe(200);
    expect(boss.body.level).toBe(2); // level 2 belongs to the manager's manager — manager cannot also approve it
    const again = await mgrAgent.post(`/api/employee/approval-items/${id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(again.status).toBe(403);
  });

  it("queue is scoped: an uninvolved employee sees nothing, the current approver sees the item", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-6"));
    const strangerQueue = await strangerAgent.get("/api/employee/approval-items").set("Origin", origin);
    expect(strangerQueue.body.some((i: { id: string }) => i.id === created.body.id)).toBe(false);
    const mgrQueue = await mgrAgent.get("/api/employee/approval-items").set("Origin", origin);
    expect(mgrQueue.body.some((i: { id: string }) => i.id === created.body.id)).toBe(true);
  });

  it("an active delegation lets the substitute decide in place of the approver", async () => {
    const created = await agent.post("/api/tenant/approval-items").set("Origin", origin).send(itemBody("L-7"));
    await db.insert(approvalDelegations).values({ tenantId, principalId: managerId, substituteId: strangerId, startDate: new Date(Date.now() - 3600_000), endDate: new Date(Date.now() + 3600_000), isActive: true });
    const res = await strangerAgent.post(`/api/employee/approval-items/${created.body.id}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(res.status).toBe(200);
    expect(res.body.history[0].viaDelegation).toBe(true);
  });

  it("rejects a workflow config with no approve step", async () => {
    const res = await agent.put("/api/tenant/approval-workflow-configs/Cuti").set("Origin", origin).send({
      steps: [{ mode: "acknowledge", label: "Hanya mengetahui", approverType: "direct_manager", slaHours: 24 }],
    });
    expect(res.status).toBe(400);
  });
});
