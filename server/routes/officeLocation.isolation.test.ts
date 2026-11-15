import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, sessions, auditLogEntries, officeLocations } from "../db/schema.ts";

/** A polygon geofence must round-trip as a polygon (it used to silently come back as a circle after save/edit). */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "geofence-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
let tenantId: string;
let entityId: string;
let agent: ReturnType<typeof request.agent>;

const SQUARE = [
  { lat: -6.2, lng: 106.8 },
  { lat: -6.2, lng: 106.81 },
  { lat: -6.21, lng: 106.81 },
  { lat: -6.21, lng: 106.8 },
];

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Geofence Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Geo Admin", email: "admin@geofence.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Geo Co", code: "GEOTEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });
  agent = withCsrf(request.agent(app));
  expect((await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@geofence.local", password: "ChangeMe123!" })).status).toBe(200);
});

afterAll(async () => {
  await db.delete(officeLocations).where(eq(officeLocations.tenantId, tenantId));
  await db.delete(entityClosure).where(eq(entityClosure.ancestorEntityId, entityId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("office location geofence shape", () => {
  let id: string;

  it("a polygon is stored and returned as a polygon", async () => {
    const created = await agent.post("/api/tenant/office-locations").set("Origin", origin).send({ entityId, code: "GEO-1", name: "Kompleks Poligon", latitude: -6.205, longitude: 106.805, radiusMeters: 100, shapeType: "polygon", polygonPoints: SQUARE });
    expect(created.status).toBe(201);
    expect(created.body.shapeType).toBe("polygon");
    expect(created.body.polygonPoints).toHaveLength(4);
    id = created.body.id;
  });

  it("editing other fields keeps the polygon; a polygon without 3 points is refused", async () => {
    const renamed = await agent.put(`/api/tenant/office-locations/${id}`).set("Origin", origin).send({ name: "Kompleks Poligon (baru)", radiusMeters: 250 });
    expect(renamed.status).toBe(200);
    expect(renamed.body.shapeType).toBe("polygon");
    expect(renamed.body.polygonPoints).toHaveLength(4);
    expect(renamed.body.radiusMeters).toBe(250);

    const bad = await agent.put(`/api/tenant/office-locations/${id}`).set("Origin", origin).send({ shapeType: "polygon", polygonPoints: SQUARE.slice(0, 2) });
    expect(bad.status).toBe(400);
    const noPoints = await agent.post("/api/tenant/office-locations").set("Origin", origin).send({ entityId, code: "GEO-2", name: "Tanpa Titik", shapeType: "polygon" });
    expect(noPoints.status).toBe(400);
  });

  it("switching to a circle clears the polygon, and back again needs fresh points", async () => {
    const circle = await agent.put(`/api/tenant/office-locations/${id}`).set("Origin", origin).send({ shapeType: "circle", radiusMeters: 120 });
    expect(circle.status).toBe(200);
    expect(circle.body.shapeType).toBe("circle");
    expect(circle.body.polygonPoints).toBeNull();
    const backWithout = await agent.put(`/api/tenant/office-locations/${id}`).set("Origin", origin).send({ shapeType: "polygon" });
    expect(backWithout.status).toBe(400);
    const back = await agent.put(`/api/tenant/office-locations/${id}`).set("Origin", origin).send({ shapeType: "polygon", polygonPoints: SQUARE });
    expect(back.status).toBe(200);
    expect(back.body.shapeType).toBe("polygon");
  });
});
