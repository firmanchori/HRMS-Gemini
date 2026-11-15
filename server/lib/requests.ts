import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.ts";
import { leaveRequests, overtimeRequests, employeeLoans, attendanceCorrectionRequests, attendanceRecords, shiftSwapRequests, employeeSchedules, businessTrips, employees, tenantModuleSettings, tenants } from "../db/schema.ts";
import { approvalPrechecks, finalizeHooks, ApprovalError } from "./approvalEngine.ts";
import { openApprovalItem } from "./approvalFlows.ts";
import { getLeaveBalance, postLedger } from "./leaveBalance.ts";
import { deriveAttendanceFacts } from "./attendanceFacts.ts";
import { daysInclusive, timeToMinutes, todayWib } from "./dates.ts";
import { logAudit } from "./audit.ts";

/**
 * Employee requests (leave, overtime, loans, attendance corrections, shift swaps, business trips). Every request is born "Menunggu"
 * together with its Approval Engine item (approver = the requester's real manager); the outcome is applied here, by the engine's
 * finalize hooks, exactly once. Callers (admin routes on behalf of an employee, and employee self-service routes) can never set a
 * status or an approver — those fields do not exist on the input schemas.
 */
export class RequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const timeText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:MM");
const dataUrl = z.string().max(950_000).regex(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/, "Lampiran harus berupa gambar (PNG/JPG/WebP) atau PDF");

async function activeEmployee(tenantId: string, employeeId: string) {
  const [emp] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!emp) throw new RequestError("Karyawan tidak ditemukan", 404);
  if (emp.status !== "Aktif") throw new RequestError("Hanya karyawan aktif yang dapat mengajukan.");
  return emp;
}

async function moduleSetting(tenantId: string, key: string): Promise<Record<string, unknown>> {
  const [row] = await db.select().from(tenantModuleSettings).where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, key))).limit(1);
  return (row?.settings as Record<string, unknown>) ?? {};
}

// ============================ Leave (Cuti) ============================
export const leaveInputSchema = z.object({
  leaveType: z.enum(["Cuti Tahunan", "Sakit Tanpa Surat Dokter", "Sakit dengan Surat Dokter", "Cuti Menikah", "Cuti Melahirkan", "Izin Urusan Pribadi"]),
  startDate: dateText,
  endDate: dateText,
  totalDays: z.number().int().min(1).max(365),
  reason: z.string().trim().max(1000).optional().nullable(),
  attachmentUrl: dataUrl.optional().nullable(),
});
export type LeaveInput = z.infer<typeof leaveInputSchema>;

export async function submitLeaveRequest(params: { tenantId: string; employeeId: string; input: LeaveInput; actorUserId: string | null }) {
  const { tenantId, employeeId, input } = params;
  const emp = await activeEmployee(tenantId, employeeId);
  if (input.endDate < input.startDate) throw new RequestError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  if (input.totalDays > daysInclusive(input.startDate, input.endDate)) throw new RequestError("Jumlah hari melebihi rentang tanggal yang dipilih.");
  const [clash] = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.employeeId, employeeId), inArray(leaveRequests.status, ["Menunggu", "Disetujui"]), sql`${leaveRequests.startDate} <= ${input.endDate} AND ${leaveRequests.endDate} >= ${input.startDate}`))
    .limit(1);
  if (clash) throw new RequestError("Sudah ada pengajuan cuti yang menunggu/disetujui pada rentang tanggal tersebut.", 409);
  if (input.leaveType === "Cuti Tahunan") {
    if (input.startDate.slice(0, 4) !== input.endDate.slice(0, 4)) throw new RequestError("Cuti tahunan yang melewati pergantian tahun harus diajukan terpisah per tahun.");
    const bal = await getLeaveBalance(tenantId, employeeId, Number(input.startDate.slice(0, 4)));
    if (input.totalDays > bal.available) throw new RequestError(`Saldo cuti tidak mencukupi (tersedia ${bal.available} hari, diminta ${input.totalDays}).`);
  }
  const [created] = await db.insert(leaveRequests).values({ ...input, tenantId, employeeId, status: "Menunggu" }).returning();
  const item = await openApprovalItem({ tenantId, category: "Cuti", referenceId: created.id, title: `Permohonan ${created.leaveType} (${created.totalDays} Hari) - ${emp.fullName}`, requesterId: employeeId, notes: `${created.startDate} s/d ${created.endDate}: ${created.reason ?? ""}` });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "leave.submitted", details: { leaveRequestId: created.id, employeeId, approvalItemId: item.id } });
  return created;
}

approvalPrechecks["Cuti"] = async (item) => {
  const [req] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, item.referenceId)).limit(1);
  if (!req || req.leaveType !== "Cuti Tahunan") return;
  const bal = await getLeaveBalance(item.tenantId, req.employeeId, Number(req.startDate.slice(0, 4)));
  // This request is itself counted in `pending`, so what remains for it is `remaining`.
  if (req.totalDays > bal.remaining) throw new ApprovalError(`Saldo cuti karyawan tidak lagi mencukupi (sisa ${bal.remaining} hari, diminta ${req.totalDays}).`, 409);
};
finalizeHooks["Cuti"] = async (item, by) => {
  if (item.status === "Disetujui") {
    const [req] = await db.update(leaveRequests).set({ status: "Disetujui", approvedBy: by }).where(eq(leaveRequests.id, item.referenceId)).returning();
    if (req?.leaveType === "Cuti Tahunan") {
      await postLedger({ tenantId: item.tenantId, employeeId: req.employeeId, year: Number(req.startDate.slice(0, 4)), kind: "deduct", days: req.totalDays, sourceType: "leave_request", sourceId: req.id, note: `Cuti ${req.startDate} s/d ${req.endDate}` });
    }
  } else if (item.status === "Ditolak") {
    await db.update(leaveRequests).set({ status: "Ditolak", approvedBy: by }).where(eq(leaveRequests.id, item.referenceId));
  }
};

// ============================ Overtime (Lembur) ============================
export const overtimeInputSchema = z
  .object({
    entityId: z.string().uuid().optional().nullable(),
    date: dateText,
    startTime: timeText,
    endTime: timeText,
    hours: z.number().int().min(1).max(12),
    reason: z.string().trim().min(3, "Alasan lembur wajib diisi").max(1000),
    type: z.enum(["Pengajuan Karyawan", "Perintah Atasan"]).optional(),
    compensationType: z.enum(["Lembur Berbayar", "Cuti Pengganti"]).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((b) => b.endTime !== b.startTime, { message: "Jam selesai tidak boleh sama dengan jam mulai", path: ["endTime"] });
export type OvertimeInput = z.infer<typeof overtimeInputSchema>;

export async function submitOvertimeRequest(params: { tenantId: string; employeeId: string; input: OvertimeInput; actorUserId: string | null }) {
  const { tenantId, employeeId, input } = params;
  const emp = await activeEmployee(tenantId, employeeId);
  let span = timeToMinutes(input.endTime) - timeToMinutes(input.startTime);
  if (span < 0) span += 1440;
  if (input.hours * 60 > span + 59) throw new RequestError("Jumlah jam melebihi selisih jam mulai dan selesai.");
  const [clash] = await db.select({ id: overtimeRequests.id }).from(overtimeRequests).where(and(eq(overtimeRequests.employeeId, employeeId), eq(overtimeRequests.date, input.date), inArray(overtimeRequests.status, ["Menunggu", "Disetujui"]))).limit(1);
  if (clash) throw new RequestError("Sudah ada pengajuan lembur yang menunggu/disetujui pada tanggal tersebut.", 409);
  const [created] = await db.insert(overtimeRequests).values({ ...input, tenantId, employeeId, status: "Menunggu", approvedBy: null, approvedHours: null }).returning();
  await openApprovalItem({ tenantId, category: "Lembur", referenceId: created.id, title: `Lembur: ${emp.fullName} (${created.hours} jam - ${created.date})`, requesterId: employeeId, notes: created.reason });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "overtime.submitted", details: { overtimeRequestId: created.id, employeeId } });
  return created;
}
finalizeHooks["Lembur"] = async (item, by) => {
  if (item.status === "Disetujui") {
    await db.update(overtimeRequests).set({ status: "Disetujui", approvedBy: by, approvedHours: sql`${overtimeRequests.hours}` }).where(eq(overtimeRequests.id, item.referenceId));
  } else if (item.status === "Ditolak") {
    await db.update(overtimeRequests).set({ status: "Ditolak", approvedBy: by, approvedHours: 0 }).where(eq(overtimeRequests.id, item.referenceId));
  }
};

// ============================ Loans (Pinjaman) ============================
export const loanInputSchema = z.object({
  loanType: z.string().trim().min(1).max(100),
  totalAmount: z.number().int().min(1),
  tenorMonths: z.number().int().min(1).max(120),
  monthlyInstallment: z.number().int().min(1),
  startDate: dateText,
  reason: z.string().trim().max(1000).optional().nullable(),
  adminFee: z.number().int().min(0).optional().nullable(),
  interestMethod: z.string().trim().max(100).optional().nullable(),
  interestRatePercent: z.number().min(0).max(100).optional().nullable(),
});
export type LoanInput = z.infer<typeof loanInputSchema>;

export async function submitLoanRequest(params: { tenantId: string; employeeId: string; input: LoanInput; actorUserId: string | null }) {
  const { tenantId, employeeId, input } = params;
  const emp = await activeEmployee(tenantId, employeeId);
  const cfg = await moduleSetting(tenantId, "loan");
  const maxTenor = Number(cfg.maxTenorMonths) || 12;
  const maxPercent = Number(cfg.maxPlafonSalaryPercent) || 30;
  if (input.tenorMonths > maxTenor) throw new RequestError(`Tenor maksimal ${maxTenor} bulan.`);
  if (emp.basicSalary > 0 && input.monthlyInstallment > (emp.basicSalary * maxPercent) / 100) {
    throw new RequestError(`Cicilan bulanan melebihi ${maxPercent}% gaji pokok (maks Rp ${Math.floor((emp.basicSalary * maxPercent) / 100).toLocaleString("id-ID")}).`);
  }
  if (input.monthlyInstallment * input.tenorMonths < input.totalAmount) throw new RequestError("Cicilan × tenor tidak mencukupi untuk melunasi total pinjaman.");
  if (!cfg.allowMultipleActiveLoans) {
    const [open] = await db.select({ id: employeeLoans.id }).from(employeeLoans).where(and(eq(employeeLoans.employeeId, employeeId), inArray(employeeLoans.status, ["Aktif", "Menunggu Approval"]))).limit(1);
    if (open) throw new RequestError("Karyawan masih memiliki pinjaman aktif atau yang sedang menunggu persetujuan.", 409);
  }
  const [created] = await db.insert(employeeLoans).values({ ...input, tenantId, employeeId, remainingAmount: input.totalAmount, status: "Menunggu Approval" }).returning();
  await openApprovalItem({ tenantId, category: "Pinjaman", referenceId: created.id, title: `Pengajuan ${created.loanType}: ${emp.fullName} (Tenor ${created.tenorMonths} Bln)`, requesterId: employeeId, amount: created.totalAmount, notes: created.reason });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "loan.submitted", details: { loanId: created.id, employeeId, amount: created.totalAmount } });
  return created;
}
finalizeHooks["Pinjaman"] = async (item) => {
  if (item.status === "Disetujui") await db.update(employeeLoans).set({ status: "Aktif" }).where(and(eq(employeeLoans.id, item.referenceId), eq(employeeLoans.status, "Menunggu Approval")));
  else if (item.status === "Ditolak") await db.update(employeeLoans).set({ status: "Ditolak", rejectionReason: item.rejectionReason ?? null }).where(and(eq(employeeLoans.id, item.referenceId), eq(employeeLoans.status, "Menunggu Approval")));
};

// ============================ Attendance correction ============================
export const correctionInputSchema = z
  .object({
    date: dateText,
    type: z.string().trim().min(1).max(100),
    proposedClockIn: timeText.optional().nullable(),
    proposedClockOut: timeText.optional().nullable(),
    reason: z.string().trim().min(3, "Alasan koreksi wajib diisi").max(1000),
    attachmentUrl: dataUrl.optional().nullable(),
  })
  .refine((b) => b.proposedClockIn || b.proposedClockOut, { message: "Isi minimal satu jam yang diusulkan", path: ["proposedClockIn"] });
export type CorrectionInput = z.infer<typeof correctionInputSchema>;

export async function submitAttendanceCorrection(params: { tenantId: string; employeeId: string; input: CorrectionInput; actorUserId: string | null }) {
  const { tenantId, employeeId, input } = params;
  const emp = await activeEmployee(tenantId, employeeId);
  if (input.date > todayWib()) throw new RequestError("Koreksi presensi tidak bisa untuk tanggal yang belum terjadi.");
  const [open] = await db.select({ id: attendanceCorrectionRequests.id }).from(attendanceCorrectionRequests).where(and(eq(attendanceCorrectionRequests.employeeId, employeeId), eq(attendanceCorrectionRequests.date, input.date), eq(attendanceCorrectionRequests.status, "Menunggu"))).limit(1);
  if (open) throw new RequestError("Sudah ada koreksi untuk tanggal tersebut yang menunggu persetujuan.", 409);
  const [created] = await db.insert(attendanceCorrectionRequests).values({ ...input, tenantId, employeeId, status: "Menunggu", approvedBy: null }).returning();
  await openApprovalItem({ tenantId, category: "Perbaikan Presensi", referenceId: created.id, title: `Koreksi Presensi (${created.type}) - ${emp.fullName}`, requesterId: employeeId, notes: created.reason });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "attendance_correction.submitted", details: { correctionId: created.id, employeeId, date: created.date } });
  return created;
}
finalizeHooks["Perbaikan Presensi"] = async (item, by) => {
  if (item.status === "Ditolak") {
    await db.update(attendanceCorrectionRequests).set({ status: "Ditolak", approvedBy: by }).where(eq(attendanceCorrectionRequests.id, item.referenceId));
    return;
  }
  if (item.status !== "Disetujui") return;
  const [corr] = await db.update(attendanceCorrectionRequests).set({ status: "Disetujui", approvedBy: by }).where(and(eq(attendanceCorrectionRequests.id, item.referenceId), eq(attendanceCorrectionRequests.status, "Menunggu"))).returning();
  if (!corr) return; // already applied
  const [existing] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, item.tenantId), eq(attendanceRecords.employeeId, corr.employeeId), eq(attendanceRecords.date, corr.date))).limit(1);
  const clockIn = corr.proposedClockIn ?? existing?.clockIn ?? null;
  const clockOut = corr.proposedClockOut ?? existing?.clockOut ?? null;
  // Lateness is re-derived from the corrected times against the rostered shift — a correction doesn't blindly erase it.
  const facts = await deriveAttendanceFacts(item.tenantId, corr.employeeId, corr.date, clockIn, clockOut);
  const note = `Koreksi Presensi (${corr.type}) disetujui: ${corr.reason ?? ""}`;
  if (existing) {
    await db.update(attendanceRecords).set({ clockIn, clockOut, status: facts.status ?? "Hadir", lateMinutes: facts.lateMinutes, overtimeHours: facts.overtimeHours, notes: note }).where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({ tenantId: item.tenantId, employeeId: corr.employeeId, date: corr.date, clockIn, clockOut, status: facts.status ?? "Hadir", lateMinutes: facts.lateMinutes, overtimeHours: facts.overtimeHours, notes: note });
  }
};

// ============================ Shift swap ============================
export const swapInputSchema = z.object({
  targetEmployeeId: z.string().uuid(),
  requestDate: dateText,
  targetDate: dateText,
  reason: z.string().trim().min(3, "Alasan wajib diisi").max(1000),
});
export type SwapInput = z.infer<typeof swapInputSchema>;

export async function submitShiftSwapRequest(params: { tenantId: string; requesterId: string; input: SwapInput; actorUserId: string | null }) {
  const { tenantId, requesterId, input } = params;
  const requester = await activeEmployee(tenantId, requesterId);
  if (input.targetEmployeeId === requesterId) throw new RequestError("Tidak dapat menukar shift dengan diri sendiri.");
  await activeEmployee(tenantId, input.targetEmployeeId);
  const mine = (await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, tenantId), eq(employeeSchedules.employeeId, requesterId), eq(employeeSchedules.date, input.requestDate))).limit(1))[0];
  const theirs = (await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, tenantId), eq(employeeSchedules.employeeId, input.targetEmployeeId), eq(employeeSchedules.date, input.targetDate))).limit(1))[0];
  if (!mine || !theirs) throw new RequestError("Kedua karyawan harus memiliki jadwal pada tanggal masing-masing untuk bertukar shift.");
  if (mine.shiftId === theirs.shiftId) throw new RequestError("Kedua jadwal sudah sama; tidak ada yang perlu ditukar.");
  const [created] = await db.insert(shiftSwapRequests).values({ ...input, tenantId, requesterId, requestShiftId: mine.shiftId, targetShiftId: theirs.shiftId, status: "Menunggu", approvedBy: null }).returning();
  await openApprovalItem({ tenantId, category: "Tukar Shift", referenceId: created.id, title: `Pengajuan Tukar Shift: ${requester.fullName}`, requesterId, notes: created.reason });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "shift_swap.submitted", details: { swapId: created.id, requesterId } });
  return created;
}
/** The roster must be unchanged since the request was filed — checked BEFORE the decision is recorded so a stale swap is refused cleanly. */
approvalPrechecks["Tukar Shift"] = async (item) => {
  const [swap] = await db.select().from(shiftSwapRequests).where(eq(shiftSwapRequests.id, item.referenceId)).limit(1);
  if (!swap) return;
  const find = async (employeeId: string, date: string) => (await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, item.tenantId), eq(employeeSchedules.employeeId, employeeId), eq(employeeSchedules.date, date))).limit(1))[0];
  const a = await find(swap.requesterId, swap.requestDate);
  const b = await find(swap.targetEmployeeId, swap.targetDate);
  if (!a || !b || a.shiftId !== swap.requestShiftId || b.shiftId !== swap.targetShiftId) throw new ApprovalError("Jadwal sudah berubah sejak pengajuan dibuat; ajukan ulang tukar shift.", 409);
};
finalizeHooks["Tukar Shift"] = async (item, by) => {
  if (item.status === "Ditolak") {
    await db.update(shiftSwapRequests).set({ status: "Ditolak", approvedBy: by }).where(eq(shiftSwapRequests.id, item.referenceId));
    return;
  }
  if (item.status !== "Disetujui") return;
  await db.transaction(async (tx) => {
    const [swap] = await tx.update(shiftSwapRequests).set({ status: "Disetujui", approvedBy: by }).where(and(eq(shiftSwapRequests.id, item.referenceId), eq(shiftSwapRequests.status, "Menunggu"))).returning();
    if (!swap) return;
    const find = async (employeeId: string, date: string) => (await tx.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, item.tenantId), eq(employeeSchedules.employeeId, employeeId), eq(employeeSchedules.date, date))).limit(1))[0];
    const a = await find(swap.requesterId, swap.requestDate);
    const b = await find(swap.targetEmployeeId, swap.targetDate);
    // Both rows must still exist and be unchanged since the request — otherwise the swap would silently use a stale roster.
    if (!a || !b || a.shiftId !== swap.requestShiftId || b.shiftId !== swap.targetShiftId) throw new ApprovalError("Jadwal sudah berubah sejak pengajuan dibuat; ajukan ulang tukar shift.", 409);
    await tx.update(employeeSchedules).set({ shiftId: b.shiftId }).where(eq(employeeSchedules.id, a.id));
    await tx.update(employeeSchedules).set({ shiftId: a.shiftId }).where(eq(employeeSchedules.id, b.id));
  });
};

// ============================ Business trip (SPPD) ============================
export const tripInputSchema = z
  .object({
    destinationCity: z.string().trim().min(2).max(200),
    startDate: dateText,
    endDate: dateText,
    totalDays: z.number().int().min(1).max(365),
    purpose: z.string().trim().min(3, "Tujuan perjalanan wajib diisi").max(2000),
    transportType: z.enum(["Pesawat", "Kereta Api", "Mobil Operasional", "Travel"]),
    estimatedCost: z.number().int().min(0),
    perDiemDaily: z.number().int().min(0),
    accommodationCost: z.number().int().min(0),
  })
  .refine((b) => b.endDate >= b.startDate, { message: "Tanggal kembali tidak boleh sebelum tanggal berangkat", path: ["endDate"] });
export type TripInput = z.infer<typeof tripInputSchema>;

export async function submitBusinessTrip(params: { tenantId: string; employeeId: string; input: TripInput; actorUserId: string | null }) {
  const { tenantId, employeeId, input } = params;
  const emp = await activeEmployee(tenantId, employeeId);
  if (input.totalDays > daysInclusive(input.startDate, input.endDate)) throw new RequestError("Jumlah hari melebihi rentang tanggal perjalanan.");
  const [tenant] = await db.select({ subdomain: tenants.subdomain }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const year = new Date().getFullYear();
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(businessTrips).where(eq(businessTrips.tenantId, tenantId));
  let n = c + 1;
  let tripNumber = "";
  for (;;) {
    tripNumber = `${String(n).padStart(3, "0")}/SPPD/${tenant.subdomain.toUpperCase().slice(0, 8)}/${year}`;
    const [clash] = await db.select({ id: businessTrips.id }).from(businessTrips).where(and(eq(businessTrips.tenantId, tenantId), eq(businessTrips.tripNumber, tripNumber))).limit(1);
    if (!clash) break;
    n += 1;
  }
  const [created] = await db.insert(businessTrips).values({ ...input, tenantId, employeeId, tripNumber, status: "Menunggu Approval", approvedBy: null }).returning();
  await openApprovalItem({ tenantId, category: "Perjalanan Dinas", referenceId: created.id, title: `SPPD ke ${created.destinationCity} (${created.totalDays} Hari) - ${emp.fullName}`, requesterId: employeeId, amount: created.estimatedCost, notes: created.purpose });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "business_trip.submitted", details: { tripId: created.id, tripNumber, employeeId } });
  return created;
}
finalizeHooks["Perjalanan Dinas"] = async (item, by) => {
  if (item.status === "Disetujui") await db.update(businessTrips).set({ status: "Disetujui Finance", approvedBy: by }).where(and(eq(businessTrips.id, item.referenceId), ne(businessTrips.status, "Selesai")));
  else if (item.status === "Ditolak") await db.update(businessTrips).set({ status: "Ditolak", approvedBy: by }).where(eq(businessTrips.id, item.referenceId));
};
