import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { ensureDefaultEmployeeRbac } from "../lib/permissions.ts";
import { lateMinutes, overtimeHours, DEFAULT_SHIFT, type ShiftRule } from "../lib/attendanceFacts.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, employees, employeeAccounts, sessions, auditLogEntries, approvalItems, leaveRequests, leaveBalances, leaveLedger, overtimeRequests, employeeLoans, attendanceCorrectionRequests, attendanceRecords, shiftSwapRequests, employeeSchedules, workShifts, businessTrips, companyCalendarEvents, rolePermissionEntries, roleDefinitions } from "../db/schema.ts";

/**
 * B7/B8/B9: every request is born pending WITH its server-created approval item (approver = the real manager), outcomes are applied
 * once by the engine's hooks, the leave balance is a ledger, and lateness/overtime are derived from the shift on the server.
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "requests-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
const PASSWORD = "ChangeMe123!";

let tenantId: string;
let entityId: string;
let mgrId: string;
let staffId: string;
let otherId: string;
let admin: ReturnType<typeof request.agent>;
let staff: ReturnType<typeof request.agent>;
let mgr: ReturnType<typeof request.agent>;
let other: ReturnType<typeof request.agent>;

async function itemFor(refId: string) {
  return (await db.select().from(approvalItems).where(and(eq(approvalItems.tenantId, tenantId), eq(approvalItems.referenceId, refId))))[0];
}

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Requests Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Req Admin", email: "admin@requests.local", passwordHash: await bcrypt.hash(PASSWORD, 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Req Co", code: "REQTEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });
  const [m] = await db.insert(employees).values({ tenantId, entityId, nik: "REQ-M", fullName: "Manajer Req", basicSalary: 20_000_000 }).returning();
  mgrId = m.id;
  const [s] = await db.insert(employees).values({ tenantId, entityId, nik: "REQ-S", fullName: "Staf Req", managerId: mgrId, basicSalary: 10_000_000 }).returning();
  staffId = s.id;
  const [o] = await db.insert(employees).values({ tenantId, entityId, nik: "REQ-O", fullName: "Orang Lain", basicSalary: 5_000_000 }).returning();
  otherId = o.id;
  await ensureDefaultEmployeeRbac(tenantId);
  const hash = await bcrypt.hash(PASSWORD, 10);
  await db.insert(employeeAccounts).values([
    { tenantId, employeeId: mgrId, email: "mgr@requests.local", passwordHash: hash, roleKey: "manager" },
    { tenantId, employeeId: staffId, email: "staff@requests.local", passwordHash: hash, roleKey: "employee" },
    { tenantId, employeeId: otherId, email: "other@requests.local", passwordHash: hash, roleKey: "employee" },
  ]);
  const login = async (path: string, email: string) => {
    const a = withCsrf(request.agent(app));
    expect((await a.post(path).set("Origin", origin).send({ email, password: PASSWORD })).status).toBe(200);
    return a;
  };
  admin = await login("/api/auth/login", "admin@requests.local");
  staff = await login("/api/employee/login", "staff@requests.local");
  mgr = await login("/api/employee/login", "mgr@requests.local");
  other = await login("/api/employee/login", "other@requests.local");
});

afterAll(async () => {
  await db.delete(attendanceRecords).where(eq(attendanceRecords.tenantId, tenantId));
  await db.delete(attendanceCorrectionRequests).where(eq(attendanceCorrectionRequests.tenantId, tenantId));
  await db.delete(shiftSwapRequests).where(eq(shiftSwapRequests.tenantId, tenantId));
  await db.delete(employeeSchedules).where(eq(employeeSchedules.tenantId, tenantId));
  await db.delete(workShifts).where(eq(workShifts.tenantId, tenantId));
  await db.delete(businessTrips).where(eq(businessTrips.tenantId, tenantId));
  await db.delete(employeeLoans).where(eq(employeeLoans.tenantId, tenantId));
  await db.delete(overtimeRequests).where(eq(overtimeRequests.tenantId, tenantId));
  await db.delete(leaveLedger).where(eq(leaveLedger.tenantId, tenantId));
  await db.delete(leaveBalances).where(eq(leaveBalances.tenantId, tenantId));
  await db.delete(leaveRequests).where(eq(leaveRequests.tenantId, tenantId));
  await db.delete(companyCalendarEvents).where(eq(companyCalendarEvents.tenantId, tenantId));
  await db.delete(approvalItems).where(eq(approvalItems.tenantId, tenantId));
  await db.delete(employeeAccounts).where(eq(employeeAccounts.tenantId, tenantId));
  await db.delete(rolePermissionEntries).where(eq(rolePermissionEntries.tenantId, tenantId));
  await db.delete(roleDefinitions).where(eq(roleDefinitions.tenantId, tenantId));
  await db.update(employees).set({ managerId: null }).where(eq(employees.tenantId, tenantId));
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

const decide = (agent: typeof mgr, itemId: string, decision: "Disetujui" | "Ditolak", reason?: string) =>
  agent.post(`/api/employee/approval-items/${itemId}/decision`).set("Origin", origin).send({ decision, reason });

describe("B7 + B8: leave through the engine, balance as a ledger", () => {
  let leaveId: string;
  it("born pending with a server-created item routed to the real manager; a client cannot pre-approve", async () => {
    const res = await staff.post("/api/employee/leave").set("Origin", origin).send({ leaveType: "Cuti Tahunan", startDate: "2026-12-01", endDate: "2026-12-03", totalDays: 3, reason: "Liburan", status: "Disetujui", approvedBy: "Saya sendiri" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Menunggu");
    expect(res.body.approvedBy).toBeNull();
    leaveId = res.body.id;
    const item = await itemFor(leaveId);
    expect(item.category).toBe("Cuti");
    expect(item.status).toBe("Menunggu");
    expect(item.steps[0].approverEmployeeId).toBe(mgrId);
    const bal = (await staff.get("/api/employee/requests/leave-balance?year=2026").set("Origin", origin)).body;
    expect(bal).toMatchObject({ entitlement: 12, used: 0, pending: 3, remaining: 12, available: 9 });
  });
  it("overlapping and over-balance requests are refused; the engine refuses the requester and strangers", async () => {
    expect((await staff.post("/api/employee/leave").set("Origin", origin).send({ leaveType: "Cuti Tahunan", startDate: "2026-12-02", endDate: "2026-12-02", totalDays: 1 })).status).toBe(409);
    const tooMany = await staff.post("/api/employee/leave").set("Origin", origin).send({ leaveType: "Cuti Tahunan", startDate: "2026-12-10", endDate: "2026-12-24", totalDays: 10 });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error).toMatch(/Saldo cuti tidak mencukupi/);
    const item = await itemFor(leaveId);
    expect((await decide(staff, item.id, "Disetujui")).status).toBe(403);
    expect((await decide(other, item.id, "Disetujui")).status).toBe(403);
  });
  it("manager approval applies the deduction once; a second decision changes nothing", async () => {
    const item = await itemFor(leaveId);
    expect((await decide(mgr, item.id, "Disetujui")).status).toBe(200);
    const [leave] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId));
    expect(leave.status).toBe("Disetujui");
    expect(leave.approvedBy).toBe("Manajer Req");
    let bal = (await staff.get("/api/employee/requests/leave-balance?year=2026").set("Origin", origin)).body;
    expect(bal).toMatchObject({ used: 3, remaining: 9, pending: 0 });
    expect((await decide(mgr, item.id, "Disetujui")).status).toBe(400);
    bal = (await staff.get("/api/employee/requests/leave-balance?year=2026").set("Origin", origin)).body;
    expect(bal.used).toBe(3);
  });
  it("a rejected request deducts nothing", async () => {
    const res = await staff.post("/api/employee/leave").set("Origin", origin).send({ leaveType: "Cuti Tahunan", startDate: "2026-12-15", endDate: "2026-12-16", totalDays: 2 });
    const item = await itemFor(res.body.id);
    expect((await decide(mgr, item.id, "Ditolak", "Bertabrakan dengan proyek")).status).toBe(200);
    const bal = (await staff.get("/api/employee/requests/leave-balance?year=2026").set("Origin", origin)).body;
    expect(bal).toMatchObject({ used: 3, remaining: 9 });
  });
  it("a company-wide cuti bersama is written to the ledger of every active employee, and shows in the admin balances", async () => {
    const ev = await admin.post("/api/tenant/calendar-events").set("Origin", origin).send({ title: "Cuti Bersama Natal", date: "2026-12-26", type: "Cuti Bersama", deductsLeaveBucket: true });
    expect(ev.status).toBe(201);
    const balances = (await admin.get("/api/tenant/leave-balances?year=2026").set("Origin", origin)).body as { employeeId: string; remaining: number; used: number }[];
    expect(balances.find((b) => b.employeeId === staffId)).toMatchObject({ used: 4, remaining: 8 });
    expect(balances.find((b) => b.employeeId === otherId)).toMatchObject({ used: 1, remaining: 11 });
  });
  it("client-opened or client-edited approval items for server-managed categories are refused", async () => {
    const forged = await admin.post("/api/tenant/approval-items").set("Origin", origin).send({ category: "Cuti", referenceId: leaveId, title: "x", requesterId: staffId, assignedApproverRole: "manager" });
    expect(forged.status).toBe(400);
    const item = await itemFor(leaveId);
    const flip = await admin.put(`/api/tenant/approval-items/${item.id}`).set("Origin", origin).send({ status: "Menunggu" });
    expect(flip.status).toBe(400);
  });
});

describe("B7: overtime, loans, corrections, swaps, trips", () => {
  it("overtime: pending → approved with approvedHours set by the server; same-day duplicate refused", async () => {
    const res = await staff.post("/api/employee/requests/overtime").set("Origin", origin).send({ date: "2026-11-10", startTime: "18:00", endTime: "21:00", hours: 3, reason: "Deploy", status: "Disetujui", approvedHours: 99 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Menunggu");
    expect(res.body.approvedHours).toBeNull();
    expect((await staff.post("/api/employee/requests/overtime").set("Origin", origin).send({ date: "2026-11-10", startTime: "18:00", endTime: "20:00", hours: 2, reason: "Lagi" })).status).toBe(409);
    expect((await staff.post("/api/employee/requests/overtime").set("Origin", origin).send({ date: "2026-11-11", startTime: "18:00", endTime: "19:00", hours: 5, reason: "Terlalu banyak" })).status).toBe(400);
    expect((await decide(mgr, (await itemFor(res.body.id)).id, "Disetujui")).status).toBe(200);
    const [row] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, res.body.id));
    expect(row).toMatchObject({ status: "Disetujui", approvedHours: 3, approvedBy: "Manajer Req" });
  });

  it("loan: enforces the DSR/tenor settings and one open loan; approval activates it; the old edit route is gone", async () => {
    const base = { loanType: "Kasbon", totalAmount: 5_000_000, tenorMonths: 6, monthlyInstallment: 1_000_000, startDate: "2026-12-01", reason: "Darurat" };
    expect((await staff.post("/api/employee/requests/loans").set("Origin", origin).send({ ...base, monthlyInstallment: 4_000_000 })).body.error).toMatch(/30%/);
    expect((await staff.post("/api/employee/requests/loans").set("Origin", origin).send({ ...base, tenorMonths: 36 })).body.error).toMatch(/Tenor maksimal/);
    const ok = await staff.post("/api/employee/requests/loans").set("Origin", origin).send({ ...base, status: "Aktif", remainingAmount: 1 });
    expect(ok.status).toBe(201);
    expect(ok.body.status).toBe("Menunggu Approval");
    expect(ok.body.remainingAmount).toBe(5_000_000);
    expect((await staff.post("/api/employee/requests/loans").set("Origin", origin).send(base)).status).toBe(409);
    expect((await decide(mgr, (await itemFor(ok.body.id)).id, "Disetujui")).status).toBe(200);
    expect((await db.select().from(employeeLoans).where(eq(employeeLoans.id, ok.body.id)))[0].status).toBe("Aktif");
    expect((await admin.put(`/api/tenant/loans/${ok.body.id}`).set("Origin", origin).send({ status: "Lunas" })).status).toBe(404);
  });

  it("attendance correction: applied on approval with lateness re-derived from the shift (not blindly erased)", async () => {
    const onTime = await staff.post("/api/employee/requests/corrections").set("Origin", origin).send({ date: "2026-11-02", type: "Lupa Clock-in", proposedClockIn: "07:55", proposedClockOut: "17:30", reason: "Lupa absen" });
    expect(onTime.status).toBe(201);
    await decide(mgr, (await itemFor(onTime.body.id)).id, "Disetujui").expect(200);
    let [rec] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.employeeId, staffId), eq(attendanceRecords.date, "2026-11-02")));
    expect(rec).toMatchObject({ clockIn: "07:55", clockOut: "17:30", lateMinutes: 0, status: "Hadir" });

    const late = await staff.post("/api/employee/requests/corrections").set("Origin", origin).send({ date: "2026-11-03", type: "Lupa Clock-in", proposedClockIn: "09:00", proposedClockOut: "17:00", reason: "Lupa absen" });
    await decide(mgr, (await itemFor(late.body.id)).id, "Disetujui").expect(200);
    [rec] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.employeeId, staffId), eq(attendanceRecords.date, "2026-11-03")));
    expect(rec).toMatchObject({ lateMinutes: 60, status: "Terlambat" });
    expect((await staff.post("/api/employee/requests/corrections").set("Origin", origin).send({ date: "2099-01-01", type: "x", proposedClockIn: "08:00", reason: "masa depan" })).status).toBe(400);
  });

  it("shift swap: needs both rosters; approval swaps them atomically; a roster that changed since is refused before the decision", async () => {
    const [s1] = await db.insert(workShifts).values({ tenantId, name: "Pagi", code: "P", startTime: "07:00", endTime: "16:00" }).returning();
    const [s2] = await db.insert(workShifts).values({ tenantId, name: "Siang", code: "S", startTime: "13:00", endTime: "22:00" }).returning();
    await db.insert(employeeSchedules).values([
      { tenantId, employeeId: staffId, date: "2026-12-05", shiftId: s1.id },
      { tenantId, employeeId: otherId, date: "2026-12-05", shiftId: s2.id },
      { tenantId, employeeId: staffId, date: "2026-12-06", shiftId: s1.id },
      { tenantId, employeeId: otherId, date: "2026-12-06", shiftId: s2.id },
    ]);
    expect((await staff.post("/api/employee/requests/shift-swaps").set("Origin", origin).send({ targetEmployeeId: otherId, requestDate: "2026-12-09", targetDate: "2026-12-09", reason: "tidak ada jadwal" })).status).toBe(400);
    const swap = await staff.post("/api/employee/requests/shift-swaps").set("Origin", origin).send({ targetEmployeeId: otherId, requestDate: "2026-12-05", targetDate: "2026-12-05", reason: "Urusan keluarga", status: "Disetujui" });
    expect(swap.status).toBe(201);
    expect(swap.body.status).toBe("Menunggu");
    await decide(mgr, (await itemFor(swap.body.id)).id, "Disetujui").expect(200);
    const shiftOf = async (e: string, d: string) => (await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.employeeId, e), eq(employeeSchedules.date, d))))[0].shiftId;
    expect(await shiftOf(staffId, "2026-12-05")).toBe(s2.id);
    expect(await shiftOf(otherId, "2026-12-05")).toBe(s1.id);

    const stale = await staff.post("/api/employee/requests/shift-swaps").set("Origin", origin).send({ targetEmployeeId: otherId, requestDate: "2026-12-06", targetDate: "2026-12-06", reason: "Lagi" });
    await db.update(employeeSchedules).set({ shiftId: "OFF" }).where(and(eq(employeeSchedules.employeeId, otherId), eq(employeeSchedules.date, "2026-12-06")));
    const res = await decide(mgr, (await itemFor(stale.body.id)).id, "Disetujui");
    expect(res.status).toBe(409);
    expect((await itemFor(stale.body.id)).status).toBe("Menunggu"); // refused before the decision was recorded
  });

  it("business trip: server-numbered, approval sets 'Disetujui Finance', completion is admin-side and only after approval", async () => {
    const trip = { destinationCity: "Surabaya", startDate: "2026-12-10", endDate: "2026-12-11", totalDays: 2, purpose: "Audit cabang", transportType: "Pesawat", estimatedCost: 3_000_000, perDiemDaily: 400_000, accommodationCost: 800_000 };
    const res = await staff.post("/api/employee/requests/trips").set("Origin", origin).send({ ...trip, tripNumber: "HACK", status: "Selesai" });
    expect(res.status).toBe(201);
    expect(res.body.tripNumber).not.toBe("HACK");
    expect(res.body.status).toBe("Menunggu Approval");
    expect((await admin.post(`/api/tenant/business-trips/${res.body.id}/complete`).set("Origin", origin)).status).toBe(409);
    await decide(mgr, (await itemFor(res.body.id)).id, "Disetujui").expect(200);
    expect((await db.select().from(businessTrips).where(eq(businessTrips.id, res.body.id)))[0].status).toBe("Disetujui Finance");
    const done = await admin.post(`/api/tenant/business-trips/${res.body.id}/complete`).set("Origin", origin);
    expect(done.body.status).toBe("Selesai");
  });
});

describe("B9: lateness and overtime are derived on the server", () => {
  it("admin attendance entry ignores client-supplied lateness/overtime and derives them from the shift", async () => {
    const res = await admin.post("/api/tenant/attendance-records/upsert").set("Origin", origin).send({ employeeId: staffId, date: "2026-11-12", clockIn: "08:40", clockOut: "19:30", lateMinutes: 0, overtimeHours: 9, status: "Hadir" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ lateMinutes: 40, overtimeHours: 2, status: "Terlambat" });
    const sick = await admin.post("/api/tenant/attendance-records/upsert").set("Origin", origin).send({ employeeId: otherId, date: "2026-11-12", status: "Sakit" });
    expect(sick.body).toMatchObject({ lateMinutes: 0, overtimeHours: 0, status: "Sakit" });
    expect((await admin.post("/api/tenant/attendance-records/upsert").set("Origin", origin).send({ employeeId: staffId, date: "2026-11-13", clockIn: "8:40" })).status).toBe(400);
  });

  const shift = (over: Partial<ShiftRule> = {}): ShiftRule => ({ ...DEFAULT_SHIFT, isOff: false, source: "builtin", ...over });
  it("late = minutes from the shift start once the tolerance is exceeded", () => {
    expect(lateMinutes(shift(), "08:10")).toBe(0); // within the 15-minute tolerance
    expect(lateMinutes(shift(), "08:15")).toBe(0);
    expect(lateMinutes(shift(), "08:16")).toBe(16);
    expect(lateMinutes(shift({ startTime: "07:00", lateToleranceMins: 5 }), "07:30")).toBe(30);
  });
  it("overtime = whole hours after the shift end, including a night shift that crosses midnight", () => {
    expect(overtimeHours(shift(), "17:59")).toBe(0);
    expect(overtimeHours(shift(), "19:00")).toBe(2);
    const night = shift({ startTime: "21:00", endTime: "06:00" });
    expect(lateMinutes(night, "21:20")).toBe(20);
    expect(overtimeHours(night, "07:30", "21:00")).toBe(1);
    expect(overtimeHours(night, "05:00", "21:00")).toBe(0);
  });
});
