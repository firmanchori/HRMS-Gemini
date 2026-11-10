import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, sessions, auditLogEntries, probationEvaluationTemplates, companyEntities, companyDivisions } from "../db/schema.ts";

/** Probation template: per-category distinct question lists + Divisi/Departemen/Jabatan scope (user, 2026-11-10). */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "probtest-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
let tenantId: string;
let divisionId: string;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Prob Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Prob Admin", email: "admin@probtest.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Prob Co", code: "PROB" }).returning();
  const [div] = await db.insert(companyDivisions).values({ tenantId, entityId: entity.id, code: "ENG", name: "Engineering" } as any).returning();
  divisionId = div.id;
  agent = withCsrf(request.agent(app));
  const login = await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@probtest.local", password: "ChangeMe123!" });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(probationEvaluationTemplates).where(eq(probationEvaluationTemplates.tenantId, tenantId));
  await db.delete(companyDivisions).where(eq(companyDivisions.tenantId, tenantId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("probation evaluation template", () => {
  it("persists each category's own distinct question list and its division scope", async () => {
    const cat1 = Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, text: `K1 pertanyaan ${i + 1}` }));
    const cat2 = Array.from({ length: 20 }, (_, i) => ({ id: `b${i}`, text: `K2 pertanyaan ${i + 1}` }));
    const res = await agent.post("/api/tenant/probation-evaluation-templates").set("Origin", origin).send({
      name: "Template Engineering",
      categories: [
        { id: "c1", label: "Teknis", questions: cat1 },
        { id: "c2", label: "Perilaku", questions: cat2 },
      ],
      divisionId,
      validFrom: "2026-01-01",
    });
    expect(res.status).toBe(201);
    expect(res.body.divisionId).toBe(divisionId);
    expect(res.body.categories[0].questions).toHaveLength(10);
    expect(res.body.categories[1].questions).toHaveLength(20);
    expect(res.body.categories[0].questions[0].text).not.toBe(res.body.categories[1].questions[0].text);
  });

  it("rejects a category with an empty question text", async () => {
    const res = await agent.post("/api/tenant/probation-evaluation-templates").set("Origin", origin).send({
      name: "Bad",
      categories: [{ id: "c1", label: "X", questions: [{ id: "q", text: "" }] }],
      validFrom: "2026-01-01",
    });
    expect(res.status).toBe(400);
  });
});
