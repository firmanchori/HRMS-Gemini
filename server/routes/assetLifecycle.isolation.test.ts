import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, sessions, auditLogEntries, companyEntities, employees, gaAssets, procurementOrders, offboardingRecords, entityClosure } from "../db/schema.ts";

/** Procurement -> Asset link, return-to-GA, derived usageStatus, offboarding clearance against the real register. */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "assettest-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
let tenantId: string;
let empId: string;
let entityId: string;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Asset Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Asset Admin", email: "admin@assettest.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Asset Co", code: "AST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entity.id, descendantEntityId: entity.id, depth: 0 });
  const [emp] = await db.insert(employees).values({ tenantId, entityId: entity.id, nik: "AS-1", fullName: "Pemegang Aset" }).returning();
  empId = emp.id;
  agent = withCsrf(request.agent(app));
  const login = await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@assettest.local", password: "ChangeMe123!" });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(offboardingRecords).where(eq(offboardingRecords.tenantId, tenantId));
  await db.delete(gaAssets).where(eq(gaAssets.tenantId, tenantId));
  await db.delete(procurementOrders).where(eq(procurementOrders.tenantId, tenantId));
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

describe("asset lifecycle", () => {
  let assetId: string;

  it("marking a PO received generates assets carrying vendor/PO/warranty, once", async () => {
    const po = await agent.post("/api/tenant/procurement-orders").set("Origin", origin).send({
      prNumber: "PR-1", poNumber: "PO-1", vendorName: "PT Vendor", itemName: "Laptop Dev", quantity: 2, estimatedCost: 30000000,
      requestor: "GA", department: "IT", requestedDate: "2026-11-01", warrantyMonths: 24,
    });
    expect(po.status).toBe(201);
    const recv = await agent.put(`/api/tenant/procurement-orders/${po.body.id}`).set("Origin", origin).send({ status: "Barang Diterima", receivedDate: "2026-11-10" });
    expect(recv.status).toBe(200);
    expect(recv.body.generatedAssetCount).toBe(2);
    const again = await agent.put(`/api/tenant/procurement-orders/${po.body.id}`).set("Origin", origin).send({ status: "Barang Diterima" });
    expect(again.body.generatedAssetCount).toBe(0);

    const list = await agent.get("/api/tenant/ga-assets").set("Origin", origin);
    const a = list.body.find((x: { poNumber: string }) => x.poNumber === "PO-1");
    assetId = a.id;
    expect(a.purchasePrice).toBe(15000000);
    expect(a.warrantyExpiryDate).toBe("2028-11-10");
    expect(a.usageStatus).toBe("Tersedia");
    expect(a.procurementOrderId).toBe(po.body.id);
  });

  it("assigning derives Digunakan (client usageStatus ignored) and return-to-GA makes it Tersedia", async () => {
    const assign = await agent.put(`/api/tenant/ga-assets/${assetId}`).set("Origin", origin).send({ assignedToEmployeeId: empId, usageStatus: "Tersedia" });
    expect(assign.body.usageStatus).toBe("Digunakan");
    const held = await agent.get(`/api/tenant/employees/${empId}/assets`).set("Origin", origin);
    expect(held.body).toHaveLength(1);

    const blocked = await agent.post("/api/tenant/offboarding-records").set("Origin", origin).send({ employeeId: empId, separationType: "Resign Sukarela", requestDate: "2026-11-10", effectiveDate: "2026-12-10" });
    const clear = await agent.put(`/api/tenant/offboarding-records/${blocked.body.id}`).set("Origin", origin).send({ assetReturned: true });
    expect(clear.status).toBe(409);

    const ret = await agent.post(`/api/tenant/ga-assets/${assetId}/return`).set("Origin", origin).send({});
    expect(ret.body.usageStatus).toBe("Tersedia");
    expect(ret.body.assignedToEmployeeId).toBeNull();
    const ok = await agent.put(`/api/tenant/offboarding-records/${blocked.body.id}`).set("Origin", origin).send({ assetReturned: true });
    expect(ok.status).toBe(200);
  });
});
