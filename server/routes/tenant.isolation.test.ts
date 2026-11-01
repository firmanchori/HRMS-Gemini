import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, orgChangeProposals, orgStructureSnapshots, companyDivisions, auditLogEntries } from "../db/schema.ts";

/**
 * Integration test (real DB, no mocks, per testing-standards.md rule 5):
 * proves the vertical-only entity visibility rule end to end — a holding
 * sees its descendants, a child sees only its own descendants, and two
 * siblings never see each other even though their shared parent sees both
 * — plus the full org-change-proposal lifecycle (draft -> submit -> approve
 * requires a letter number, applies the diff, and snapshots the prior state).
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "orgtest-tenant";
const ADMIN_EMAIL = "admin@orgtest.local";
const ADMIN_PASSWORD = "ChangeMe123!";

let tenantId: string;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Org Test Tenant", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Org Test Admin", email: ADMIN_EMAIL, passwordHash });

  agent = request.agent(app);
  const loginRes = await agent.post("/api/auth/login").set("Origin", `http://${SUBDOMAIN}.${baseDomain}`).send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(loginRes.status).toBe(200);
});

afterAll(async () => {
  // Clean up everything created for this test tenant.
  const entityRows = await db.select().from(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  for (const e of entityRows) {
    await db.delete(companyDivisions).where(eq(companyDivisions.entityId, e.id));
    await db.delete(entityClosure).where(eq(entityClosure.descendantEntityId, e.id));
  }
  await db.delete(orgStructureSnapshots).where(eq(orgStructureSnapshots.tenantId, tenantId));
  await db.delete(orgChangeProposals).where(eq(orgChangeProposals.tenantId, tenantId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

const origin = `http://${SUBDOMAIN}.${baseDomain}`;

describe("entity visibility — vertical only, never sibling-to-sibling", () => {
  it("builds a holding -> {anakA, anakB}, anakA -> cucuC tree and enforces visibility", async () => {
    const holdingRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Holding", code: "HOLD" });
    expect(holdingRes.status).toBe(201);
    const holdingId = holdingRes.body.id;

    const anakARes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Anak A", code: "ANAKA", parentEntityId: holdingId });
    const anakAId = anakARes.body.id;
    const anakBRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Anak B", code: "ANAKB", parentEntityId: holdingId });
    const anakBId = anakBRes.body.id;
    const cucuCRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Cucu C", code: "CUCUC", parentEntityId: anakAId });
    const cucuCId = cucuCRes.body.id;

    // Holding sees everything.
    const fromHolding = await agent.get(`/api/tenant/entities?viewAsEntityId=${holdingId}`).set("Origin", origin);
    expect(fromHolding.body.map((e: { id: string }) => e.id).sort()).toEqual([holdingId, anakAId, anakBId, cucuCId].sort());

    // Anak A sees itself + its own descendant (Cucu C), but NOT its sibling Anak B.
    const fromAnakA = await agent.get(`/api/tenant/entities?viewAsEntityId=${anakAId}`).set("Origin", origin);
    const anakAVisibleIds = fromAnakA.body.map((e: { id: string }) => e.id).sort();
    expect(anakAVisibleIds).toEqual([anakAId, cucuCId].sort());
    expect(anakAVisibleIds).not.toContain(anakBId);
    expect(anakAVisibleIds).not.toContain(holdingId);

    // Anak B sees only itself — it has no descendants and is not Anak A's sibling-visible.
    const fromAnakB = await agent.get(`/api/tenant/entities?viewAsEntityId=${anakBId}`).set("Origin", origin);
    expect(fromAnakB.body.map((e: { id: string }) => e.id)).toEqual([anakBId]);
  });
});

describe("org change proposal lifecycle", () => {
  it("requires an official letter number before a proposal can be approved", async () => {
    const entityRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Proposal Test Entity", code: "PTE" });
    const entityId = entityRes.body.id;

    const draftRes = await agent
      .post("/api/tenant/org-change-proposals")
      .set("Origin", origin)
      .send({ entityId, title: "Tambah Divisi Baru", changes: { divisions: { create: [{ code: "MKT", name: "Marketing" }] } } });
    expect(draftRes.status).toBe(201);
    expect(draftRes.body.status).toBe("Draft");
    const proposalId = draftRes.body.id;

    const submitRes = await agent.post(`/api/tenant/org-change-proposals/${proposalId}/submit`).set("Origin", origin);
    expect(submitRes.body.status).toBe("PendingApproval");

    const approveWithoutLetterRes = await agent.post(`/api/tenant/org-change-proposals/${proposalId}/approve`).set("Origin", origin);
    expect(approveWithoutLetterRes.status).toBe(400);

    await agent.put(`/api/tenant/org-change-proposals/${proposalId}`).set("Origin", origin).send({ officialLetterNumber: "" }); // still Draft-only guard shouldn't matter here since status check happens on approve
  });

  it("approving applies the diff and snapshots the prior state", async () => {
    const entityRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Apply Test Entity", code: "ATE" });
    const entityId = entityRes.body.id;

    const draftRes = await agent
      .post("/api/tenant/org-change-proposals")
      .set("Origin", origin)
      .send({
        entityId,
        title: "Tambah Divisi Marketing",
        officialLetterNumber: "SK-001/HR/2026",
        changes: { divisions: { create: [{ code: "MKT", name: "Marketing" }] } },
      });
    const proposalId = draftRes.body.id;
    await agent.post(`/api/tenant/org-change-proposals/${proposalId}/submit`).set("Origin", origin);

    const approveRes = await agent.post(`/api/tenant/org-change-proposals/${proposalId}/approve`).set("Origin", origin);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe("Approved");

    const structureRes = await agent.get(`/api/tenant/entities/${entityId}/org-structure`).set("Origin", origin);
    expect(structureRes.body.divisions.map((d: { name: string }) => d.name)).toContain("Marketing");

    const snapshots = await db.select().from(orgStructureSnapshots).where(eq(orgStructureSnapshots.proposalId, proposalId));
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].divisions).toEqual([]); // snapshot taken BEFORE the new division existed
  });
});
