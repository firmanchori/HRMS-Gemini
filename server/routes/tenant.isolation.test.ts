import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, orgChangeProposals, orgStructureSnapshots, companyDivisions, auditLogEntries, documentTemplates } from "../db/schema.ts";

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

  agent = withCsrf(request.agent(app));
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
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  // The tenant's root entity gets its own copy of the default document
  // catalog seeded automatically now (server/routes/tenant.ts POST
  // /entities) — clean that up too, or the FK on document_templates.tenant_id
  // blocks the tenants delete below.
  await db.delete(documentTemplates).where(eq(documentTemplates.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId)); // must go before companyEntities — users.entityId references it
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

const origin = `http://${SUBDOMAIN}.${baseDomain}`;

/**
 * Every child entity must bundle exactly one admin for it — see tenant.ts's
 * provisioning rule. Deliberately NOT "ChangeMe123!" (this repo's shared
 * dev-seed password, inserted directly by seed scripts that bypass this
 * route entirely) — these go through POST /entities, which now rejects
 * known-breached passwords via HIBP, and "ChangeMe123!" is breached.
 */
const CHILD_ADMIN_PASSWORD = "Qz7#nK4vTxw9Lm2p";
let adminSeq = 0;
function childAdminPayload() {
  adminSeq += 1;
  return { name: `Admin Anak ${adminSeq}`, email: `admin-anak-${adminSeq}@orgtest.local`, password: CHILD_ADMIN_PASSWORD };
}

let holdingId: string;
let anakAId: string;

describe("entity visibility — vertical only, never sibling-to-sibling", () => {
  it("builds a holding -> {anakA, anakB}, anakA -> cucuC tree and enforces visibility", async () => {
    const holdingRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Holding", code: "HOLD" });
    expect(holdingRes.status).toBe(201);
    holdingId = holdingRes.body.id;

    const anakARes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Anak A", code: "ANAKA", parentEntityId: holdingId, admin: childAdminPayload() });
    expect(anakARes.status).toBe(201);
    anakAId = anakARes.body.id;
    const anakBRes = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Anak B", code: "ANAKB", parentEntityId: holdingId, admin: childAdminPayload() });
    const anakBId = anakBRes.body.id;

    // Anak A's own admin logs in to create Anak A's child — the holding's admin has no authority over Anak A's descendants.
    const anakAAdminAgent = withCsrf(request.agent(app));
    const anakAAdminCreds = { email: anakARes.body.admin.email, password: CHILD_ADMIN_PASSWORD };
    const anakALoginRes = await anakAAdminAgent.post("/api/auth/login").set("Origin", origin).send(anakAAdminCreds);
    expect(anakALoginRes.status).toBe(200);
    const cucuCRes = await anakAAdminAgent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Cucu C", code: "CUCUC", parentEntityId: anakAId, admin: childAdminPayload() });
    expect(cucuCRes.status).toBe(201);
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

describe("entity provisioning — a parent's job stops at its child's one admin", () => {
  it("rejects a root-level (no parent) entity once the tenant already has a holding", async () => {
    const res = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Second Holding", code: "HOLD2" });
    expect(res.status).toBe(403);
  });

  it("rejects the holding's admin creating a grandchild directly under Anak A (only Anak A's own admin may)", async () => {
    const res = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "Illicit Cucu", code: "ILLICIT", parentEntityId: anakAId, admin: childAdminPayload() });
    expect(res.status).toBe(403);
  });

  it("requires a bundled admin when creating any child entity", async () => {
    const res = await agent.post("/api/tenant/entities").set("Origin", origin).send({ name: "No Admin Child", code: "NOADMIN", parentEntityId: holdingId });
    expect(res.status).toBe(400);
  });
});

describe("org change proposal lifecycle", () => {
  it("requires an official letter number before a proposal can be approved", async () => {
    const entityRes = await agent
      .post("/api/tenant/entities")
      .set("Origin", origin)
      .send({ name: "Proposal Test Entity", code: "PTE", parentEntityId: holdingId, admin: childAdminPayload() });
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
    const entityRes = await agent
      .post("/api/tenant/entities")
      .set("Origin", origin)
      .send({ name: "Apply Test Entity", code: "ATE", parentEntityId: holdingId, admin: childAdminPayload() });
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

describe("governance lock gates direct structure edits", () => {
  it("allows direct division CRUD while unlocked, then blocks it once locked", async () => {
    const entityRes = await agent
      .post("/api/tenant/entities")
      .set("Origin", origin)
      .send({ name: "Lock Test Entity", code: "LTE", parentEntityId: holdingId, admin: childAdminPayload() });
    const entityId = entityRes.body.id;
    expect(entityRes.body.isGovernanceLocked).toBe(false);

    const createRes = await agent.post("/api/tenant/divisions").set("Origin", origin).send({ entityId, code: "OPS", name: "Operations" });
    expect(createRes.status).toBe(201);
    const divisionId = createRes.body.id;

    await agent.put(`/api/tenant/entities/${entityId}`).set("Origin", origin).send({ isGovernanceLocked: true });

    const blockedCreateRes = await agent.post("/api/tenant/divisions").set("Origin", origin).send({ entityId, code: "FIN", name: "Finance" });
    expect(blockedCreateRes.status).toBe(403);

    const blockedUpdateRes = await agent.put(`/api/tenant/divisions/${divisionId}`).set("Origin", origin).send({ name: "Operations & Logistics" });
    expect(blockedUpdateRes.status).toBe(403);

    const blockedDeleteRes = await agent.delete(`/api/tenant/divisions/${divisionId}`).set("Origin", origin);
    expect(blockedDeleteRes.status).toBe(403);
  });
});
