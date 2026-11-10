import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, sessions, auditLogEntries, officialDocuments, documentSignatoryConfigs } from "../db/schema.ts";

/**
 * QR/"Resmi Diterbitkan" must be a consequence of every required signatory
 * confirming (user, 2026-11-10: "QR muncul saat sudah approve dan kosong
 * jika belum approve") — never something the client can assert on create.
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "doctest-tenant";
const ADMIN_EMAIL = "admin@doctest.local";
const ADMIN_PASSWORD = "ChangeMe123!";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;

let tenantId: string;
let agent: ReturnType<typeof request.agent>;

const baseDoc = (n: string, type: string) => ({
  documentNumber: n,
  type,
  title: "SK Uji",
  issueDate: "2026-11-10",
  signeeName: "Direktur Uji",
  signeeRole: "Direktur",
  contentPreview: "isi",
});

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Doc Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Doc Admin", email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) });
  await db.insert(documentSignatoryConfigs).values([
    { tenantId, documentType: "SKDUA", roleLabel: "HR Manager", isRequired: true, sortOrder: 0 },
    { tenantId, documentType: "SKDUA", roleLabel: "Direktur", isRequired: true, sortOrder: 1 },
  ]);
  agent = withCsrf(request.agent(app));
  const login = await agent.post("/api/auth/login").set("Origin", origin).send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(officialDocuments).where(eq(officialDocuments.tenantId, tenantId));
  await db.delete(documentSignatoryConfigs).where(eq(documentSignatoryConfigs.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("document issuance is gated by signatory confirmation", () => {
  it("ignores a client-supplied status/QR and starts pending with no QR", async () => {
    const res = await agent
      .post("/api/tenant/documents")
      .set("Origin", origin)
      .send({ ...baseDoc("001/SKDUA", "SKDUA"), status: "Resmi Diterbitkan", qrVerificationUrl: "https://evil.example/qr" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Menunggu Tanda Tangan");
    expect(res.body.qrVerificationUrl).toBeNull();
    expect(res.body.signatories).toHaveLength(2);
  });

  it("only issues the QR after every required signatory confirms", async () => {
    const created = await agent.post("/api/tenant/documents").set("Origin", origin).send(baseDoc("002/SKDUA", "SKDUA"));
    const id = created.body.id;

    const first = await agent.post(`/api/tenant/documents/${id}/signatories/0/confirm`).set("Origin", origin).send({});
    expect(first.status).toBe(200);
    expect(first.body.status).toBe("Menunggu Tanda Tangan");
    expect(first.body.qrVerificationUrl).toBeNull();

    const dup = await agent.post(`/api/tenant/documents/${id}/signatories/0/confirm`).set("Origin", origin).send({});
    expect(dup.status).toBe(400);

    const second = await agent.post(`/api/tenant/documents/${id}/signatories/1/confirm`).set("Origin", origin).send({});
    expect(second.status).toBe(200);
    expect(second.body.status).toBe("Resmi Diterbitkan");
    expect(second.body.qrVerificationUrl).toMatch(/^https:\/\/nusahr\.enterprise\/verify/);
  });

  it("an unconfigured document type still requires its nominal signee to confirm", async () => {
    const res = await agent.post("/api/tenant/documents").set("Origin", origin).send(baseDoc("003/LAIN", "TIPELAIN"));
    expect(res.body.status).toBe("Menunggu Tanda Tangan");
    expect(res.body.signatories).toHaveLength(1);
    const ok = await agent.post(`/api/tenant/documents/${res.body.id}/signatories/0/confirm`).set("Origin", origin).send({});
    expect(ok.body.status).toBe("Resmi Diterbitkan");
  });
});
