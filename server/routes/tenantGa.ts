import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, sql, ne, inArray } from "drizzle-orm";
import { db } from "../db/client.ts";
import { gaRoomBookings, gaVehicleBookings, gaOfficeSupplies, gaSupplyRequests, gaTickets, gaBastHandovers, gaAssets, employees, users, companyEntities } from "../db/schema.ts";
import { deriveUsageStatus } from "../lib/assetLifecycle.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { logAudit } from "../lib/audit.ts";
import { todayWib } from "../lib/dates.ts";

/**
 * General Affairs: meeting rooms, fleet, office supplies and helpdesk tickets. Mounted under the tenant router (so it inherits
 * requireTenantAdmin). Document/ticket numbers, initial statuses, stock arithmetic and double-booking checks are all decided here —
 * a client can only describe what it wants.
 */
export const gaRouter = Router();

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const timeText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:MM");

async function adminName(userId: string): Promise<string> {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.name ?? "Admin Tenant";
}
async function employeeInTenant(tenantId: string, id: string) {
  const [e] = await db.select({ id: employees.id, fullName: employees.fullName }).from(employees).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId))).limit(1);
  return e;
}
async function entityInTenant(tenantId: string, id: string | null | undefined) {
  if (!id) return true;
  const [e] = await db.select({ id: companyEntities.id }).from(companyEntities).where(and(eq(companyEntities.id, id), eq(companyEntities.tenantId, tenantId))).limit(1);
  return Boolean(e);
}
/** Sequential, unique-per-tenant document number: PREFIX-YYYY-NNNN (probes past gaps/collisions). */
async function nextNumber(prefix: string, countRows: () => Promise<number>, exists: (n: string) => Promise<boolean>): Promise<string> {
  const year = new Date().getFullYear();
  let n = (await countRows()) + 1;
  for (;;) {
    const candidate = `${prefix}-${year}-${String(n).padStart(4, "0")}`;
    if (!(await exists(candidate))) return candidate;
    n += 1;
  }
}
const countOf = async (table: typeof gaRoomBookings | typeof gaVehicleBookings | typeof gaTickets, tenantId: string) =>
  (await db.select({ c: sql<number>`count(*)::int` }).from(table).where(eq(table.tenantId, tenantId)))[0].c;

// ============================ Room bookings ============================
const roomBookingSchema = z
  .object({
    entityId: z.string().uuid().optional().nullable(),
    roomName: z.string().trim().min(1).max(200),
    floorLocation: z.string().trim().max(200).optional().default(""),
    capacity: z.number().int().min(1).max(10000),
    organizerId: z.string().uuid(),
    meetingTitle: z.string().trim().min(3).max(300),
    date: dateText,
    startTime: timeText,
    endTime: timeText,
    attendeesInternal: z.array(z.string().uuid()).max(500).optional().default([]),
    attendeesExternal: z.array(z.object({ name: z.string().trim().min(1).max(200), organization: z.string().trim().max(200).default(""), email: z.string().trim().max(200).default(""), phone: z.string().trim().max(50).optional(), checkedIn: z.boolean().optional() })).max(200).optional().default([]),
  })
  .refine((b) => b.endTime > b.startTime, { message: "Jam selesai harus setelah jam mulai", path: ["endTime"] });

gaRouter.get("/ga-room-bookings", async (req, res) => {
  res.json(await db.select().from(gaRoomBookings).where(eq(gaRoomBookings.tenantId, req.session!.tenantId!)).orderBy(desc(gaRoomBookings.createdAt)));
});
gaRouter.post("/ga-room-bookings", validateBody(roomBookingSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const b = req.body as z.infer<typeof roomBookingSchema>;
  if (!(await employeeInTenant(tenantId, b.organizerId))) return res.status(400).json({ error: "Penyelenggara tidak ditemukan" });
  if (!(await entityInTenant(tenantId, b.entityId))) return res.status(400).json({ error: "Entitas tidak ditemukan" });
  if (b.attendeesInternal.length + b.attendeesExternal.length > b.capacity) return res.status(400).json({ error: `Jumlah peserta melebihi kapasitas ruangan (${b.capacity}).` });
  const clash = await db
    .select({ id: gaRoomBookings.id, meetingTitle: gaRoomBookings.meetingTitle, startTime: gaRoomBookings.startTime, endTime: gaRoomBookings.endTime })
    .from(gaRoomBookings)
    .where(and(eq(gaRoomBookings.tenantId, tenantId), eq(gaRoomBookings.roomName, b.roomName), eq(gaRoomBookings.date, b.date), ne(gaRoomBookings.status, "Dibatalkan"), sql`${gaRoomBookings.startTime} < ${b.endTime} AND ${gaRoomBookings.endTime} > ${b.startTime}`))
    .limit(1);
  if (clash.length) return res.status(409).json({ error: `Ruangan sudah dipesan pada ${clash[0].startTime}–${clash[0].endTime} ("${clash[0].meetingTitle}").` });
  const bookingDocNumber = await nextNumber(
    "BKG-ROOM",
    () => countOf(gaRoomBookings, tenantId),
    async (n) => (await db.select({ id: gaRoomBookings.id }).from(gaRoomBookings).where(and(eq(gaRoomBookings.tenantId, tenantId), eq(gaRoomBookings.bookingDocNumber, n))).limit(1)).length > 0
  );
  const [created] = await db.insert(gaRoomBookings).values({ ...b, entityId: b.entityId ?? null, tenantId, bookingDocNumber, status: "Terkonfirmasi" }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.room_booked", details: { bookingId: created.id, bookingDocNumber, roomName: b.roomName, date: b.date } });
  res.status(201).json(created);
});
gaRouter.put("/ga-room-bookings/:id/status", validateParams(uuidParam("id")), validateBody(z.object({ status: z.enum(["Berjalan", "Dibatalkan"]) })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [bk] = await db.select().from(gaRoomBookings).where(and(eq(gaRoomBookings.id, req.params.id), eq(gaRoomBookings.tenantId, tenantId))).limit(1);
  if (!bk) return res.status(404).json({ error: "Reservasi tidak ditemukan" });
  if (bk.status === "Selesai" || bk.status === "Dibatalkan") return res.status(409).json({ error: `Reservasi berstatus ${bk.status} dan tidak dapat diubah.` });
  const [updated] = await db.update(gaRoomBookings).set({ status: req.body.status }).where(eq(gaRoomBookings.id, bk.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.room_status", details: { bookingId: bk.id, status: req.body.status } });
  res.json(updated);
});
/** Recording the minutes closes the meeting ("Selesai") and stamps who recorded them. */
gaRouter.post("/ga-room-bookings/:id/minutes", validateParams(uuidParam("id")), validateBody(z.object({ notes: z.string().trim().min(3, "Notulen wajib diisi").max(20000) })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [bk] = await db.select().from(gaRoomBookings).where(and(eq(gaRoomBookings.id, req.params.id), eq(gaRoomBookings.tenantId, tenantId))).limit(1);
  if (!bk) return res.status(404).json({ error: "Reservasi tidak ditemukan" });
  if (bk.status === "Dibatalkan") return res.status(409).json({ error: "Reservasi yang dibatalkan tidak dapat diberi notulen." });
  if (bk.momDocNumber) return res.status(409).json({ error: "Notulen sudah dicatat dan tidak dapat diubah." });
  const momDocNumber = bk.bookingDocNumber.replace("BKG-ROOM-", "MOM-");
  const [updated] = await db.update(gaRoomBookings).set({ momNotes: req.body.notes, momDocNumber, momRecordedBy: await adminName(req.session!.userId), status: "Selesai" }).where(eq(gaRoomBookings.id, bk.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.room_minutes", details: { bookingId: bk.id, momDocNumber } });
  res.json(updated);
});

// ============================ Vehicle bookings ============================
const vehicleBookingSchema = z
  .object({
    entityId: z.string().uuid().optional().nullable(),
    vehicleName: z.string().trim().min(1).max(200),
    plateNumber: z.string().trim().toUpperCase().min(3).max(20),
    driverType: z.enum(["Sopir Kantor", "Bawa Sendiri"]),
    driverName: z.string().trim().min(1).max(200),
    borrowerId: z.string().uuid(),
    purpose: z.string().trim().min(3).max(500),
    destination: z.string().trim().min(2).max(300),
    startDate: dateText,
    endDate: dateText,
    startOdometer: z.number().int().min(0).max(5_000_000),
    nextServiceDate: dateText.optional().nullable(),
    taxExpiryDate: dateText.optional().nullable(),
  })
  .refine((b) => b.endDate >= b.startDate, { message: "Tanggal kembali tidak boleh sebelum tanggal pinjam", path: ["endDate"] });

gaRouter.get("/ga-vehicle-bookings", async (req, res) => {
  res.json(await db.select().from(gaVehicleBookings).where(eq(gaVehicleBookings.tenantId, req.session!.tenantId!)).orderBy(desc(gaVehicleBookings.createdAt)));
});
gaRouter.post("/ga-vehicle-bookings", validateBody(vehicleBookingSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const b = req.body as z.infer<typeof vehicleBookingSchema>;
  if (!(await employeeInTenant(tenantId, b.borrowerId))) return res.status(400).json({ error: "Peminjam tidak ditemukan" });
  if (!(await entityInTenant(tenantId, b.entityId))) return res.status(400).json({ error: "Entitas tidak ditemukan" });
  if (b.taxExpiryDate && b.taxExpiryDate < b.startDate) return res.status(400).json({ error: "Pajak kendaraan sudah kedaluwarsa pada tanggal peminjaman." });
  const clash = await db
    .select({ id: gaVehicleBookings.id, startDate: gaVehicleBookings.startDate, endDate: gaVehicleBookings.endDate })
    .from(gaVehicleBookings)
    .where(and(eq(gaVehicleBookings.tenantId, tenantId), eq(gaVehicleBookings.plateNumber, b.plateNumber), inArray(gaVehicleBookings.status, ["Menunggu Approval", "Disetujui", "Sedang Digunakan"]), sql`${gaVehicleBookings.startDate} <= ${b.endDate} AND ${gaVehicleBookings.endDate} >= ${b.startDate}`))
    .limit(1);
  if (clash.length) return res.status(409).json({ error: `Kendaraan ${b.plateNumber} sudah dipakai pada ${clash[0].startDate} s/d ${clash[0].endDate}.` });
  const formDocNumber = await nextNumber(
    "SPK-ARMADA",
    () => countOf(gaVehicleBookings, tenantId),
    async (n) => (await db.select({ id: gaVehicleBookings.id }).from(gaVehicleBookings).where(and(eq(gaVehicleBookings.tenantId, tenantId), eq(gaVehicleBookings.formDocNumber, n))).limit(1)).length > 0
  );
  const [created] = await db.insert(gaVehicleBookings).values({ ...b, entityId: b.entityId ?? null, tenantId, formDocNumber, status: "Disetujui" }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.vehicle_booked", details: { bookingId: created.id, formDocNumber, plateNumber: b.plateNumber } });
  res.status(201).json(created);
});
const VEHICLE_NEXT: Record<string, string[]> = { "Menunggu Approval": ["Disetujui"], Disetujui: ["Sedang Digunakan", "Dikembalikan"], "Sedang Digunakan": ["Dikembalikan"], Dikembalikan: [] };
gaRouter.put(
  "/ga-vehicle-bookings/:id/status",
  validateParams(uuidParam("id")),
  validateBody(z.object({ status: z.enum(["Disetujui", "Sedang Digunakan", "Dikembalikan"]), endOdometer: z.number().int().min(0).optional(), fuelCost: z.number().int().min(0).optional() })),
  async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const [bk] = await db.select().from(gaVehicleBookings).where(and(eq(gaVehicleBookings.id, req.params.id), eq(gaVehicleBookings.tenantId, tenantId))).limit(1);
    if (!bk) return res.status(404).json({ error: "Peminjaman tidak ditemukan" });
    if (!VEHICLE_NEXT[bk.status]?.includes(req.body.status)) return res.status(409).json({ error: `Status tidak dapat berubah dari ${bk.status} ke ${req.body.status}.` });
    if (req.body.status === "Dikembalikan") {
      if (req.body.endOdometer === undefined) return res.status(400).json({ error: "Odometer akhir wajib diisi saat kendaraan dikembalikan." });
      if (req.body.endOdometer < bk.startOdometer) return res.status(400).json({ error: `Odometer akhir tidak boleh kurang dari odometer awal (${bk.startOdometer}).` });
    }
    const [updated] = await db
      .update(gaVehicleBookings)
      .set({ status: req.body.status, endOdometer: req.body.endOdometer ?? bk.endOdometer, fuelCost: req.body.fuelCost ?? bk.fuelCost })
      .where(eq(gaVehicleBookings.id, bk.id))
      .returning();
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.vehicle_status", details: { bookingId: bk.id, from: bk.status, to: req.body.status } });
    res.json(updated);
  }
);

// ============================ Office supplies ============================
const supplySchema = z.object({
  itemCode: z.string().trim().min(1).max(50),
  itemName: z.string().trim().min(2).max(200),
  category: z.enum(["Kertas & Dokumen", "Alat Tulis", "Tinta & Toner", "Peralatan Kantor", "Kebersihan & Pantry"]),
  currentStock: z.number().int().min(0).max(10_000_000),
  unit: z.string().trim().min(1).max(30),
  reorderPoint: z.number().int().min(0).max(10_000_000),
  standardReorderQty: z.number().int().min(0).max(10_000_000),
  estimatedUnitPrice: z.number().int().min(0).max(1_000_000_000),
});
gaRouter.get("/ga-office-supplies", async (req, res) => {
  res.json(await db.select().from(gaOfficeSupplies).where(eq(gaOfficeSupplies.tenantId, req.session!.tenantId!)));
});
gaRouter.post("/ga-office-supplies", validateBody(supplySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [dup] = await db.select({ id: gaOfficeSupplies.id }).from(gaOfficeSupplies).where(and(eq(gaOfficeSupplies.tenantId, tenantId), eq(gaOfficeSupplies.itemCode, req.body.itemCode))).limit(1);
  if (dup) return res.status(409).json({ error: `Kode barang ${req.body.itemCode} sudah terdaftar.` });
  const [created] = await db.insert(gaOfficeSupplies).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.supply_created", details: { itemId: created.id, itemCode: created.itemCode } });
  res.status(201).json(created);
});
/** Master-data edit never touches stock — stock only moves through requests (down) and restocking (up). */
gaRouter.put("/ga-office-supplies/:id", validateParams(uuidParam("id")), validateBody(supplySchema.omit({ currentStock: true, itemCode: true }).partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db.update(gaOfficeSupplies).set(req.body).where(and(eq(gaOfficeSupplies.id, req.params.id), eq(gaOfficeSupplies.tenantId, tenantId))).returning();
  if (!updated) return res.status(404).json({ error: "Barang tidak ditemukan" });
  res.json(updated);
});
gaRouter.post("/ga-office-supplies/:id/restock", validateParams(uuidParam("id")), validateBody(z.object({ qty: z.number().int().min(1).max(10_000_000) })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(gaOfficeSupplies)
    .set({ currentStock: sql`${gaOfficeSupplies.currentStock} + ${req.body.qty}` })
    .where(and(eq(gaOfficeSupplies.id, req.params.id), eq(gaOfficeSupplies.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Barang tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.supply_restocked", details: { itemId: updated.id, qty: req.body.qty } });
  res.json(updated);
});

gaRouter.get("/ga-supply-requests", async (req, res) => {
  res.json(await db.select().from(gaSupplyRequests).where(eq(gaSupplyRequests.tenantId, req.session!.tenantId!)).orderBy(desc(gaSupplyRequests.createdAt)));
});
gaRouter.post("/ga-supply-requests", validateBody(z.object({ requesterId: z.string().uuid(), department: z.string().trim().max(200).optional().default(""), itemId: z.string().uuid(), qty: z.number().int().min(1).max(100000), reason: z.string().trim().max(500).optional().default("") })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (!(await employeeInTenant(tenantId, req.body.requesterId))) return res.status(400).json({ error: "Pemohon tidak ditemukan" });
  const [item] = await db.select().from(gaOfficeSupplies).where(and(eq(gaOfficeSupplies.id, req.body.itemId), eq(gaOfficeSupplies.tenantId, tenantId))).limit(1);
  if (!item) return res.status(400).json({ error: "Barang tidak ditemukan" });
  const [created] = await db.insert(gaSupplyRequests).values({ ...req.body, tenantId, requestDate: todayWib(), status: "Menunggu Approval" }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.supply_requested", details: { requestId: created.id, itemId: item.id, qty: created.qty } });
  res.status(201).json(created);
});
/** Approve = distribute: stock is decremented atomically and only if enough exists (never goes negative); reject changes nothing else. */
gaRouter.post("/ga-supply-requests/:id/decision", validateParams(uuidParam("id")), validateBody(z.object({ approved: z.boolean() })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [reqRow] = await db.select().from(gaSupplyRequests).where(and(eq(gaSupplyRequests.id, req.params.id), eq(gaSupplyRequests.tenantId, tenantId))).limit(1);
  if (!reqRow) return res.status(404).json({ error: "Permintaan tidak ditemukan" });
  if (reqRow.status !== "Menunggu Approval") return res.status(409).json({ error: `Permintaan sudah ${reqRow.status}.` });
  if (!req.body.approved) {
    const [rejected] = await db.update(gaSupplyRequests).set({ status: "Ditolak" }).where(eq(gaSupplyRequests.id, reqRow.id)).returning();
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.supply_rejected", details: { requestId: reqRow.id } });
    return res.json(rejected);
  }
  const result = await db.transaction(async (tx) => {
    const [dec] = await tx
      .update(gaOfficeSupplies)
      .set({ currentStock: sql`${gaOfficeSupplies.currentStock} - ${reqRow.qty}` })
      .where(and(eq(gaOfficeSupplies.id, reqRow.itemId), eq(gaOfficeSupplies.tenantId, tenantId), sql`${gaOfficeSupplies.currentStock} >= ${reqRow.qty}`))
      .returning();
    if (!dec) return null;
    const [done] = await tx.update(gaSupplyRequests).set({ status: "Didistribusikan", distributedAt: todayWib() }).where(and(eq(gaSupplyRequests.id, reqRow.id), eq(gaSupplyRequests.status, "Menunggu Approval"))).returning();
    if (!done) throw new Error("race");
    return done;
  });
  if (!result) return res.status(409).json({ error: "Stok tidak mencukupi untuk didistribusikan." });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.supply_distributed", details: { requestId: reqRow.id, itemId: reqRow.itemId, qty: reqRow.qty } });
  res.json(result);
});

// ============================ Helpdesk tickets ============================
const ticketSchema = z.object({
  category: z.enum(["Aset Rusak/Perawatan", "Pinjam Ruangan/Fasilitas", "Pinjam Kendaraan", "Minta ATK/Perlengkapan", "Lainnya (Umum)"]),
  requesterId: z.string().uuid(),
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(5000).optional().default(""),
  priority: z.enum(["Rendah", "Normal", "Tinggi", "Darurat"]),
  assignedStaff: z.string().trim().max(200).optional().nullable(),
  slaHours: z.number().int().min(1).max(24 * 60).optional().default(24),
});
gaRouter.get("/ga-tickets", async (req, res) => {
  res.json(await db.select().from(gaTickets).where(eq(gaTickets.tenantId, req.session!.tenantId!)).orderBy(desc(gaTickets.createdAt)));
});
gaRouter.post("/ga-tickets", validateBody(ticketSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (!(await employeeInTenant(tenantId, req.body.requesterId))) return res.status(400).json({ error: "Pemohon tidak ditemukan" });
  const ticketNumber = await nextNumber(
    "TKT-GA",
    () => countOf(gaTickets, tenantId),
    async (n) => (await db.select({ id: gaTickets.id }).from(gaTickets).where(and(eq(gaTickets.tenantId, tenantId), eq(gaTickets.ticketNumber, n))).limit(1)).length > 0
  );
  const [created] = await db.insert(gaTickets).values({ ...req.body, assignedStaff: req.body.assignedStaff ?? null, tenantId, ticketNumber, status: "Terbuka" }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.ticket_created", details: { ticketId: created.id, ticketNumber, category: created.category } });
  res.status(201).json(created);
});
const TICKET_NEXT: Record<string, string[]> = {
  Terbuka: ["Sedang Diproses", "Ditolak"],
  "Sedang Diproses": ["Menunggu Konfirmasi", "Selesai", "Ditolak"],
  "Menunggu Konfirmasi": ["Selesai", "Sedang Diproses"],
  Selesai: [],
  Ditolak: [],
};
gaRouter.put("/ga-tickets/:id/status", validateParams(uuidParam("id")), validateBody(z.object({ status: z.enum(["Sedang Diproses", "Menunggu Konfirmasi", "Selesai", "Ditolak"]), notes: z.string().trim().max(5000).optional(), assignedStaff: z.string().trim().max(200).optional() })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [t] = await db.select().from(gaTickets).where(and(eq(gaTickets.id, req.params.id), eq(gaTickets.tenantId, tenantId))).limit(1);
  if (!t) return res.status(404).json({ error: "Tiket tidak ditemukan" });
  if (!TICKET_NEXT[t.status]?.includes(req.body.status)) return res.status(409).json({ error: `Status tidak dapat berubah dari ${t.status} ke ${req.body.status}.` });
  if ((req.body.status === "Selesai" || req.body.status === "Ditolak") && !(req.body.notes && req.body.notes.length >= 3)) return res.status(400).json({ error: "Catatan penyelesaian/penolakan wajib diisi." });
  const [updated] = await db
    .update(gaTickets)
    .set({ status: req.body.status, resolutionNotes: req.body.notes ?? t.resolutionNotes, assignedStaff: req.body.assignedStaff ?? t.assignedStaff, resolvedAt: req.body.status === "Selesai" ? new Date() : t.resolvedAt })
    .where(eq(gaTickets.id, t.id))
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga.ticket_status", details: { ticketId: t.id, from: t.status, to: req.body.status } });
  res.json(updated);
});

// ============================ BAST asset handovers ============================
const BAST_CATEGORIES = ["Aset Karyawan (Personal)", "Aset Menetap di Ruangan", "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)", "Penukaran Aset Antar Karyawan (Melalui GA)"] as const;
const BAST_PREFIX: Record<(typeof BAST_CATEGORIES)[number], string> = {
  "Aset Karyawan (Personal)": "BAST/GA-EMP",
  "Aset Menetap di Ruangan": "BAST/GA-ROOM",
  "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)": "BAST/GA-FAC-VEH",
  "Penukaran Aset Antar Karyawan (Melalui GA)": "BAST/GA-SWAP",
};
const bastSchema = z.object({
  handoverCategory: z.enum(BAST_CATEGORIES),
  gaOfficerName: z.string().trim().min(2, "Nama petugas GA wajib diisi").max(200),
  recipientEmployeeId: z.string().uuid(),
  swapPartyAEmployeeId: z.string().uuid().optional(),
  assetIds: z.array(z.string().uuid()).max(200).optional().default([]),
  swapPartyAAssetIds: z.array(z.string().uuid()).max(200).optional().default([]),
  swapPartyBAssetIds: z.array(z.string().uuid()).max(200).optional().default([]),
  building: z.string().trim().min(1, "Gedung wajib diisi").max(200),
  roomOrArea: z.string().trim().min(1, "Ruangan/area wajib diisi").max(300),
  notes: z.string().trim().max(2000).optional().default(""),
  additionalAccessories: z.string().trim().max(1000).optional(),
  vehiclePlateNumber: z.string().trim().max(20).optional(),
  vehicleStartOdometerKm: z.number().int().min(0).max(5_000_000).optional(),
  vehicleDocumentsIncluded: z.string().trim().max(500).optional(),
  facilitySkNumber: z.string().trim().max(100).optional(),
});

gaRouter.get("/ga-bast-handovers", async (req, res) => {
  res.json(await db.select().from(gaBastHandovers).where(eq(gaBastHandovers.tenantId, req.session!.tenantId!)).orderBy(desc(gaBastHandovers.createdAt)));
});

gaRouter.post("/ga-bast-handovers", validateBody(bastSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const b = req.body as z.infer<typeof bastSchema>;
  const isSwap = b.handoverCategory === "Penukaran Aset Antar Karyawan (Melalui GA)";
  const recipient = (await db.select().from(employees).where(and(eq(employees.id, b.recipientEmployeeId), eq(employees.tenantId, tenantId))).limit(1))[0];
  if (!recipient) return res.status(400).json({ error: "Karyawan penerima tidak ditemukan" });
  const partyA = isSwap && b.swapPartyAEmployeeId ? (await db.select().from(employees).where(and(eq(employees.id, b.swapPartyAEmployeeId), eq(employees.tenantId, tenantId))).limit(1))[0] : undefined;
  if (isSwap && (!partyA || partyA.id === recipient.id)) return res.status(400).json({ error: "Penukaran memerlukan dua karyawan yang berbeda." });
  if (b.handoverCategory === "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)" && (!b.vehiclePlateNumber || b.vehicleStartOdometerKm === undefined || !b.facilitySkNumber)) {
    return res.status(400).json({ error: "Plat nomor, odometer awal, dan nomor SK fasilitas wajib diisi untuk fasilitas kendaraan." });
  }
  const moveIds = isSwap ? [...b.swapPartyAAssetIds, ...b.swapPartyBAssetIds] : b.assetIds;
  if (moveIds.length === 0) return res.status(400).json({ error: "Pilih minimal satu aset." });
  if (new Set(moveIds).size !== moveIds.length) return res.status(400).json({ error: "Aset yang sama dipilih lebih dari sekali." });

  const roleOf = (e: typeof employees.$inferSelect) => {
    const d = e.details as Record<string, unknown>;
    return `${typeof d.position === "string" ? d.position : "Staff"} (${typeof d.department === "string" ? d.department : "Operasional"})`;
  };
  type Snap = { assetId: string; assetCode: string; assetName: string; category: string; condition: string };

  try {
    const created = await db.transaction(async (tx) => {
      const rows = await tx.select().from(gaAssets).where(and(eq(gaAssets.tenantId, tenantId), inArray(gaAssets.id, moveIds)));
      if (rows.length !== moveIds.length) throw new BastError("Sebagian aset tidak ditemukan.", 404);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const snap = (id: string): Snap => {
        const a = byId.get(id)!;
        return { assetId: a.id, assetCode: a.assetCode, assetName: a.name, category: a.category, condition: a.condition };
      };
      const moves: { id: string; to: string }[] = [];
      if (isSwap) {
        for (const id of b.swapPartyAAssetIds) if (byId.get(id)!.assignedToEmployeeId !== partyA!.id) throw new BastError(`Aset ${byId.get(id)!.assetCode} tidak sedang dipegang ${partyA!.fullName}.`, 409);
        for (const id of b.swapPartyBAssetIds) if (byId.get(id)!.assignedToEmployeeId !== recipient.id) throw new BastError(`Aset ${byId.get(id)!.assetCode} tidak sedang dipegang ${recipient.fullName}.`, 409);
        // Symmetric by design: A's assets go to B and B's go to A — both in this one transaction.
        for (const id of b.swapPartyAAssetIds) moves.push({ id, to: recipient.id });
        for (const id of b.swapPartyBAssetIds) moves.push({ id, to: partyA!.id });
      } else {
        for (const id of b.assetIds) if (byId.get(id)!.assignedToEmployeeId) throw new BastError(`Aset ${byId.get(id)!.assetCode} masih dipegang karyawan lain. Kembalikan ke GA terlebih dahulu.`, 409);
        for (const id of b.assetIds) moves.push({ id, to: recipient.id });
      }
      for (const m of moves) {
        const a = byId.get(m.id)!;
        await tx.update(gaAssets).set({ assignedToEmployeeId: m.to, building: b.building, room: b.roomOrArea, usageStatus: deriveUsageStatus({ assignedToEmployeeId: m.to, condition: a.condition }) }).where(eq(gaAssets.id, a.id));
      }

      const now = new Date();
      const ym = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prefix = `${BAST_PREFIX[b.handoverCategory]}/${ym}`;
      const [{ c }] = await tx.select({ c: sql<number>`count(*)::int` }).from(gaBastHandovers).where(and(eq(gaBastHandovers.tenantId, tenantId), sql`${gaBastHandovers.bastNumber} LIKE ${prefix + "/%"}`));
      let n = c + 1;
      let bastNumber = `${prefix}/${String(n).padStart(3, "0")}`;
      for (;;) {
        const [clash] = await tx.select({ id: gaBastHandovers.id }).from(gaBastHandovers).where(and(eq(gaBastHandovers.tenantId, tenantId), eq(gaBastHandovers.bastNumber, bastNumber))).limit(1);
        if (!clash) break;
        n += 1;
        bastNumber = `${prefix}/${String(n).padStart(3, "0")}`;
      }

      const items: Snap[] = isSwap ? [...b.swapPartyAAssetIds, ...b.swapPartyBAssetIds].map(snap) : b.assetIds.map(snap);
      const details: Record<string, unknown> = { items, additionalAccessories: b.additionalAccessories, isRoomLeaderResponsible: b.handoverCategory === "Aset Menetap di Ruangan" };
      if (isSwap) {
        details.swapPartyAName = partyA!.fullName;
        details.swapPartyARole = roleOf(partyA!);
        details.swapPartyAItems = b.swapPartyAAssetIds.map(snap);
        details.swapPartyBItems = b.swapPartyBAssetIds.map(snap);
      }
      if (b.handoverCategory === "Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)") {
        details.vehiclePlateNumber = b.vehiclePlateNumber;
        details.vehicleStartOdometerKm = b.vehicleStartOdometerKm;
        details.vehicleDocumentsIncluded = b.vehicleDocumentsIncluded;
        details.facilitySkNumber = b.facilitySkNumber;
      }
      const [row] = await tx
        .insert(gaBastHandovers)
        .values({
          tenantId,
          bastNumber,
          handoverDate: todayWib(),
          handoverCategory: b.handoverCategory,
          gaOfficerName: b.gaOfficerName,
          gaOfficerRole: isSwap ? "General Affairs & Asset Custodian (Verifikator Penukaran)" : "General Affairs & Asset Custodian",
          recipientEmployeeId: recipient.id,
          recipientName: recipient.fullName,
          recipientRole: roleOf(recipient),
          swapPartyAEmployeeId: partyA?.id ?? null,
          building: b.building,
          roomOrArea: b.roomOrArea,
          status: isSwap ? "Ditukar Melalui GA" : "Aktif / Diserahterimakan",
          notes: b.notes,
          details,
          createdByUserId: req.session!.userId,
        })
        .returning();
      return row;
    });
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: isSwap ? "ga.bast_swap" : "ga.bast_handover", details: { bastId: created.id, bastNumber: created.bastNumber, assets: moveIds.length } });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof BastError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

class BastError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
