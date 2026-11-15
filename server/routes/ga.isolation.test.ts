import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, employees, sessions, auditLogEntries, gaRoomBookings, gaVehicleBookings, gaOfficeSupplies, gaSupplyRequests, gaTickets, gaBastHandovers, gaAssets } from "../db/schema.ts";

/** GA facilities/fleet/supplies/tickets: server-owned numbers, status machines, double-booking checks and atomic stock. */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "ga-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
let tenantId: string;
let entityId: string;
let empId: string;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "GA Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "GA Admin", email: "admin@ga.local", passwordHash: await bcrypt.hash("ChangeMe123!", 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "GA Co", code: "GATEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });
  const [emp] = await db.insert(employees).values({ tenantId, entityId, nik: "GA-1", fullName: "Pegawai GA" }).returning();
  empId = emp.id;
  agent = withCsrf(request.agent(app));
  expect((await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@ga.local", password: "ChangeMe123!" })).status).toBe(200);
});

afterAll(async () => {
  await db.delete(gaBastHandovers).where(eq(gaBastHandovers.tenantId, tenantId));
  await db.delete(gaAssets).where(eq(gaAssets.tenantId, tenantId));
  await db.delete(gaSupplyRequests).where(eq(gaSupplyRequests.tenantId, tenantId));
  await db.delete(gaOfficeSupplies).where(eq(gaOfficeSupplies.tenantId, tenantId));
  await db.delete(gaTickets).where(eq(gaTickets.tenantId, tenantId));
  await db.delete(gaVehicleBookings).where(eq(gaVehicleBookings.tenantId, tenantId));
  await db.delete(gaRoomBookings).where(eq(gaRoomBookings.tenantId, tenantId));
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

const room = (over: Record<string, unknown> = {}) => ({ roomName: "Ruang Rapat A", floorLocation: "Lt. 2", capacity: 10, organizerId: empId, meetingTitle: "Rapat Mingguan", date: "2026-12-01", startTime: "09:00", endTime: "10:00", ...over });

describe("rooms", () => {
  let id: string;
  it("numbers and status are server-side; client-sent ones are ignored", async () => {
    const res = await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send({ ...room(), bookingDocNumber: "HACK-1", status: "Selesai" });
    expect(res.status).toBe(201);
    expect(res.body.bookingDocNumber).toMatch(/^BKG-ROOM-\d{4}-0001$/);
    expect(res.body.status).toBe("Terkonfirmasi");
    id = res.body.id;
  });
  it("double-booking an overlapping slot is refused, adjacent slots and cancelled ones are fine, bad times/capacity are 400", async () => {
    expect((await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ startTime: "09:30", endTime: "10:30" }))).status).toBe(409);
    expect((await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ startTime: "10:00", endTime: "11:00" }))).status).toBe(201);
    expect((await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ endTime: "08:00" }))).status).toBe(400);
    expect((await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ roomName: "Ruang B", capacity: 1, attendeesExternal: [{ name: "A", organization: "X", email: "a@x.com" }, { name: "B", organization: "X", email: "b@x.com" }] }))).status).toBe(400);
    await agent.put(`/api/tenant/ga-room-bookings/${id}/status`).set("Origin", origin).send({ status: "Dibatalkan" }).expect(200);
    expect((await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ startTime: "09:15", endTime: "09:45" }))).status).toBe(201);
  });
  it("a cancelled booking is final and cannot take minutes; minutes close a meeting once", async () => {
    expect((await agent.put(`/api/tenant/ga-room-bookings/${id}/status`).set("Origin", origin).send({ status: "Berjalan" })).status).toBe(409);
    expect((await agent.post(`/api/tenant/ga-room-bookings/${id}/minutes`).set("Origin", origin).send({ notes: "Notulen" })).status).toBe(409);
    const open = await agent.post("/api/tenant/ga-room-bookings").set("Origin", origin).send(room({ roomName: "Ruang C" }));
    const mom = await agent.post(`/api/tenant/ga-room-bookings/${open.body.id}/minutes`).set("Origin", origin).send({ notes: "Keputusan rapat: A, B, C" });
    expect(mom.status).toBe(200);
    expect(mom.body.status).toBe("Selesai");
    expect(mom.body.momDocNumber).toMatch(/^MOM-\d{4}-/);
    expect(mom.body.momRecordedBy).toBe("GA Admin");
    expect((await agent.post(`/api/tenant/ga-room-bookings/${open.body.id}/minutes`).set("Origin", origin).send({ notes: "ubah" })).status).toBe(409);
  });
});

describe("vehicles", () => {
  let id: string;
  const veh = (over: Record<string, unknown> = {}) => ({ vehicleName: "Avanza", plateNumber: "b 1234 xyz", driverType: "Bawa Sendiri", driverName: "Pegawai GA", borrowerId: empId, purpose: "Kunjungan klien", destination: "Bandung", startDate: "2026-12-01", endDate: "2026-12-02", startOdometer: 12000, ...over });
  it("books once per plate/date range, with a server form number", async () => {
    const res = await agent.post("/api/tenant/ga-vehicle-bookings").set("Origin", origin).send(veh());
    expect(res.status).toBe(201);
    expect(res.body.plateNumber).toBe("B 1234 XYZ");
    expect(res.body.formDocNumber).toMatch(/^SPK-ARMADA-\d{4}-0001$/);
    id = res.body.id;
    expect((await agent.post("/api/tenant/ga-vehicle-bookings").set("Origin", origin).send(veh({ startDate: "2026-12-02", endDate: "2026-12-03" }))).status).toBe(409);
    expect((await agent.post("/api/tenant/ga-vehicle-bookings").set("Origin", origin).send(veh({ startDate: "2026-12-03", endDate: "2026-12-04" }))).status).toBe(201);
    expect((await agent.post("/api/tenant/ga-vehicle-bookings").set("Origin", origin).send(veh({ plateNumber: "D 99 A", endDate: "2026-11-30" }))).status).toBe(400);
  });
  it("only legal transitions; return needs an odometer ≥ start", async () => {
    expect((await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Disetujui" })).status).toBe(409);
    await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Sedang Digunakan" }).expect(200);
    expect((await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Dikembalikan" })).status).toBe(400);
    expect((await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Dikembalikan", endOdometer: 11000 })).status).toBe(400);
    const back = await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Dikembalikan", endOdometer: 12090, fuelCost: 150000 });
    expect(back.status).toBe(200);
    expect(back.body.endOdometer).toBe(12090);
    expect((await agent.put(`/api/tenant/ga-vehicle-bookings/${id}/status`).set("Origin", origin).send({ status: "Sedang Digunakan" })).status).toBe(409);
    // After return the plate is free again for the same dates.
    expect((await agent.post("/api/tenant/ga-vehicle-bookings").set("Origin", origin).send(veh({ startDate: "2026-12-01", endDate: "2026-12-01" }))).status).toBe(201);
  });
});

describe("supplies", () => {
  let itemId: string;
  const supply = { itemCode: "ATK-001", itemName: "Kertas A4", category: "Kertas & Dokumen", currentStock: 10, unit: "rim", reorderPoint: 5, standardReorderQty: 20, estimatedUnitPrice: 50000 };
  it("item codes are unique", async () => {
    const res = await agent.post("/api/tenant/ga-office-supplies").set("Origin", origin).send(supply);
    expect(res.status).toBe(201);
    itemId = res.body.id;
    expect((await agent.post("/api/tenant/ga-office-supplies").set("Origin", origin).send(supply)).status).toBe(409);
  });
  it("approval distributes and decrements stock atomically; insufficient stock is refused; master edit cannot change stock", async () => {
    const ok = await agent.post("/api/tenant/ga-supply-requests").set("Origin", origin).send({ requesterId: empId, itemId, qty: 4, status: "Didistribusikan" });
    expect(ok.status).toBe(201);
    expect(ok.body.status).toBe("Menunggu Approval");
    const approve = await agent.post(`/api/tenant/ga-supply-requests/${ok.body.id}/decision`).set("Origin", origin).send({ approved: true });
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("Didistribusikan");
    let [item] = await db.select().from(gaOfficeSupplies).where(eq(gaOfficeSupplies.id, itemId));
    expect(item.currentStock).toBe(6);
    expect((await agent.post(`/api/tenant/ga-supply-requests/${ok.body.id}/decision`).set("Origin", origin).send({ approved: true })).status).toBe(409); // not twice
    [item] = await db.select().from(gaOfficeSupplies).where(eq(gaOfficeSupplies.id, itemId));
    expect(item.currentStock).toBe(6);

    const big = await agent.post("/api/tenant/ga-supply-requests").set("Origin", origin).send({ requesterId: empId, itemId, qty: 50 });
    expect((await agent.post(`/api/tenant/ga-supply-requests/${big.body.id}/decision`).set("Origin", origin).send({ approved: true })).status).toBe(409);
    expect((await agent.post(`/api/tenant/ga-supply-requests/${big.body.id}/decision`).set("Origin", origin).send({ approved: false })).status).toBe(200);
    [item] = await db.select().from(gaOfficeSupplies).where(eq(gaOfficeSupplies.id, itemId));
    expect(item.currentStock).toBe(6);

    await agent.put(`/api/tenant/ga-office-supplies/${itemId}`).set("Origin", origin).send({ itemName: "Kertas A4 80gr", currentStock: 9999 }).expect(200);
    [item] = await db.select().from(gaOfficeSupplies).where(eq(gaOfficeSupplies.id, itemId));
    expect(item.itemName).toBe("Kertas A4 80gr");
    expect(item.currentStock).toBe(6);
    const restock = await agent.post(`/api/tenant/ga-office-supplies/${itemId}/restock`).set("Origin", origin).send({ qty: 14 });
    expect(restock.body.currentStock).toBe(20);
  });
});

describe("tickets", () => {
  it("numbering, state machine, mandatory resolution note, resolvedAt set by the server", async () => {
    const t = await agent.post("/api/tenant/ga-tickets").set("Origin", origin).send({ category: "Aset Rusak/Perawatan", requesterId: empId, title: "AC bocor", description: "Ruang 2", priority: "Tinggi", status: "Selesai" });
    expect(t.status).toBe(201);
    expect(t.body.ticketNumber).toMatch(/^TKT-GA-\d{4}-0001$/);
    expect(t.body.status).toBe("Terbuka");
    const id = t.body.id;
    expect((await agent.put(`/api/tenant/ga-tickets/${id}/status`).set("Origin", origin).send({ status: "Selesai", notes: "ok" })).status).toBe(409); // must be processed first
    await agent.put(`/api/tenant/ga-tickets/${id}/status`).set("Origin", origin).send({ status: "Sedang Diproses", assignedStaff: "Teknisi" }).expect(200);
    expect((await agent.put(`/api/tenant/ga-tickets/${id}/status`).set("Origin", origin).send({ status: "Selesai" })).status).toBe(400);
    const done = await agent.put(`/api/tenant/ga-tickets/${id}/status`).set("Origin", origin).send({ status: "Selesai", notes: "Freon diisi ulang" });
    expect(done.status).toBe(200);
    expect(done.body.resolvedAt).toBeTruthy();
    expect(done.body.assignedStaff).toBe("Teknisi");
    expect((await agent.put(`/api/tenant/ga-tickets/${id}/status`).set("Origin", origin).send({ status: "Sedang Diproses" })).status).toBe(409); // final
  });
});

describe("BAST handovers move the assets in the same transaction", () => {
  let empB: string;
  const mkAsset = async (code: string) => {
    const r = await agent.post("/api/tenant/ga-assets").set("Origin", origin).send({ assetCode: code, name: `Laptop ${code}`, category: "Laptop & Komputer", building: "Gedung A", room: "Gudang", purchaseDate: "2026-01-01", purchasePrice: 10000000, lastStockOpname: "2026-01-01", qrPayload: code });
    expect(r.status).toBe(201);
    return r.body.id as string;
  };
  const holder = async (id: string) => (await db.select().from(gaAssets).where(eq(gaAssets.id, id)))[0].assignedToEmployeeId;

  it("hands over unassigned assets: numbered by the server, items snapshotted, assets assigned; an already-held asset is refused", async () => {
    const [b] = await db.insert(employees).values({ tenantId, entityId, nik: "GA-2", fullName: "Pegawai B" }).returning();
    empB = b.id;
    const a1 = await mkAsset("AST-B1");
    const a2 = await mkAsset("AST-B2");
    const res = await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Aset Karyawan (Personal)", gaOfficerName: "Petugas GA", recipientEmployeeId: empId, assetIds: [a1], building: "Gedung A", roomOrArea: "Lt 2", bastNumber: "HACK", items: [] });
    expect(res.status).toBe(201);
    expect(res.body.bastNumber).toMatch(/^BAST\/GA-EMP\/\d{4}\/\d{2}\/001$/);
    expect(res.body.details.items[0].assetCode).toBe("AST-B1");
    expect(await holder(a1)).toBe(empId);
    const [asset] = await db.select().from(gaAssets).where(eq(gaAssets.id, a1));
    expect(asset.usageStatus).toBe("Digunakan");
    expect(asset.room).toBe("Lt 2");

    const again = await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Aset Karyawan (Personal)", gaOfficerName: "Petugas GA", recipientEmployeeId: empB, assetIds: [a1, a2], building: "G", roomOrArea: "R" });
    expect(again.status).toBe(409);
    expect(await holder(a2)).toBeNull(); // nothing moved: all-or-nothing
    expect((await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Aset Karyawan (Personal)", gaOfficerName: "Petugas GA", recipientEmployeeId: empB, assetIds: [], building: "G", roomOrArea: "R" })).status).toBe(400);
  });

  it("swaps symmetrically and atomically; validates who holds what; vehicle facility needs plate/odometer/SK", async () => {
    const a1 = (await db.select().from(gaAssets).where(eq(gaAssets.assetCode, "AST-B1")))[0].id;
    const a2 = (await db.select().from(gaAssets).where(eq(gaAssets.assetCode, "AST-B2")))[0].id;
    await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Aset Karyawan (Personal)", gaOfficerName: "Petugas GA", recipientEmployeeId: empB, assetIds: [a2], building: "G", roomOrArea: "R" }).expect(201);
    expect(await holder(a1)).toBe(empId);
    expect(await holder(a2)).toBe(empB);

    const wrong = await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Penukaran Aset Antar Karyawan (Melalui GA)", gaOfficerName: "Petugas GA", swapPartyAEmployeeId: empId, recipientEmployeeId: empB, swapPartyAAssetIds: [a2], swapPartyBAssetIds: [a1], building: "G", roomOrArea: "R" });
    expect(wrong.status).toBe(409);
    expect(await holder(a1)).toBe(empId);
    expect(await holder(a2)).toBe(empB);

    const swap = await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Penukaran Aset Antar Karyawan (Melalui GA)", gaOfficerName: "Petugas GA", swapPartyAEmployeeId: empId, recipientEmployeeId: empB, swapPartyAAssetIds: [a1], swapPartyBAssetIds: [a2], building: "G", roomOrArea: "R" });
    expect(swap.status).toBe(201);
    expect(swap.body.status).toBe("Ditukar Melalui GA");
    expect(swap.body.bastNumber).toMatch(/^BAST\/GA-SWAP\//);
    expect(await holder(a1)).toBe(empB);
    expect(await holder(a2)).toBe(empId);
    expect((await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Penukaran Aset Antar Karyawan (Melalui GA)", gaOfficerName: "Petugas GA", swapPartyAEmployeeId: empId, recipientEmployeeId: empId, swapPartyAAssetIds: [a2], swapPartyBAssetIds: [], building: "G", roomOrArea: "R" })).status).toBe(400);

    const veh = await mkAsset("AST-VEH");
    expect((await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)", gaOfficerName: "Petugas GA", recipientEmployeeId: empB, assetIds: [veh], building: "G", roomOrArea: "R" })).status).toBe(400);
    expect((await agent.post("/api/tenant/ga-bast-handovers").set("Origin", origin).send({ handoverCategory: "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)", gaOfficerName: "Petugas GA", recipientEmployeeId: empB, assetIds: [veh], building: "G", roomOrArea: "R", vehiclePlateNumber: "B 1 X", vehicleStartOdometerKm: 100, facilitySkNumber: "SK-1" })).status).toBe(201);
  });
});
