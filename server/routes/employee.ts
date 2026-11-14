import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "../db/client.ts";
import { employeeAccounts, employees, attendanceRecords, leaveRequests, payrollRecords, gaAssets, procurementOrders, complianceRecords, employeeLoans, businessTrips, employeeKpis, jobRequisitions, jobVacancies, candidates, offboardingRecords, companyCalendarEvents, auditTrailEntries, approvalItems, officialDocuments, documentSignatoryConfigs, documentTemplates, companyEntities } from "../db/schema.ts";
import { issueSession, requireEmployeeSession, requirePermission, issueMfaTicket, readMfaTicket, clearMfaTicket } from "../middleware/auth.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { authLimiter } from "../lib/rateLimit.ts";
import { logAudit } from "../lib/audit.ts";
import { logLoginAttempt, isAccountLockedOut, LOCKOUT_WINDOW_MINUTES, alertIfAccountJustLockedOut } from "./auth.ts";
import { getPermission } from "../lib/permissions.ts";
import { isInManagerChain } from "../lib/orgHierarchy.ts";
import { checkClockIn, checkClockOut, performClockIn, performClockOut, ClockError } from "../lib/attendanceClock.ts";
import { encryptSecret, decryptSecret } from "../lib/crypto.ts";
import { generateTotpSecret, totpOtpauthUrl, verifyTotpCode, generateBackupCodes, hashBackupCode, consumeBackupCode } from "../lib/totp.ts";
import { sendSecurityAlert } from "../lib/alerts.ts";
import { personaliaActionSchema, createPersonaliaAction, submitPersonaliaAction, deletePersonaliaDraft, listPersonaliaActions, PersonaliaError } from "../lib/personalia.ts";
import { decideApproval, withDerivedStatus, currentBlockingStep, activeDelegatorIds, ApprovalError } from "../lib/approvalEngine.ts";

/**
 * Real employee (ESS) / manager (MSS) login and the first real,
 * server-enforced slice of the RBAC matrix — closing the "tidak ada role
 * karyawan sungguhan / RBAC granular tidak ditegakkan" finding (user,
 * 2026-11-09). Scoped deliberately to the core self-service flows first
 * (own profile, own attendance, own leave requests, a manager's approval
 * queue for direct reports) rather than every module at once — see the
 * commit message for the phased rollout this is part of.
 */
export const employeeRouter = Router();

const employeeLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

employeeRouter.post("/login", authLimiter, validateBody(employeeLoginSchema), async (req, res) => {
  const { email, password } = req.body;
  const tenantId = req.tenant?.id ?? null;
  const ip = req.ip ?? "unknown";

  if (!tenantId) return res.status(400).json({ error: "Login karyawan hanya tersedia di subdomain perusahaan" });

  if (await isAccountLockedOut(tenantId, email)) {
    return res.status(429).json({ error: `Terlalu banyak percobaan login gagal untuk akun ini. Coba lagi dalam ${LOCKOUT_WINDOW_MINUTES} menit.` });
  }

  const [account] = await db
    .select()
    .from(employeeAccounts)
    .where(and(eq(employeeAccounts.tenantId, tenantId), eq(employeeAccounts.email, email)))
    .limit(1);

  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "failure", reason: "invalid_credentials", ip });
    await alertIfAccountJustLockedOut(tenantId, email);
    return res.status(401).json({ error: "Email atau password salah" });
  }
  if (!account.isActive) {
    await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "failure", reason: "account_disabled", ip });
    return res.status(403).json({ error: "Akun Anda telah dinonaktifkan. Hubungi HR/Admin perusahaan Anda." });
  }
  if (req.tenant!.status !== "Active") {
    await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "failure", reason: `tenant_${req.tenant!.status}`, ip });
    return res.status(403).json({ error: "Akun perusahaan Anda tidak aktif." });
  }

  // A correct password isn't the whole login when MFA is enabled — same
  // pending-ticket pattern as the admin/App-Owner login in auth.ts
  // (security review, user 2026-11-10: "MFA untuk karyawan" — this branch
  // didn't exist at all before, so an employee account could never have a
  // working second factor no matter how it was configured).
  if (account.totpEnabled) {
    await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "success", reason: "password_ok_awaiting_mfa", ip });
    issueMfaTicket(res, { userId: account.id, role: "employee", tenantId });
    return res.json({ mfaRequired: true });
  }

  await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "success", ip });
  await issueSession(req, res, { userId: account.id, role: "employee", tenantId, employeeId: account.employeeId, roleKey: account.roleKey });

  const [employee] = await db.select().from(employees).where(eq(employees.id, account.employeeId)).limit(1);
  res.json({ id: account.id, email: account.email, roleKey: account.roleKey, name: employee?.fullName ?? account.email });
});

const employeeMfaVerifyLoginSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

/** Second step of employee login when the account has MFA enabled — mirrors authRouter's /mfa/verify-login but reads/writes employee_accounts instead of users. */
employeeRouter.post("/mfa/verify-login", authLimiter, validateBody(employeeMfaVerifyLoginSchema), async (req, res) => {
  const { code } = req.body;
  const ticket = readMfaTicket(req);
  if (!ticket || ticket.role !== "employee") return res.status(401).json({ error: "Sesi verifikasi kedaluwarsa, silakan login ulang" });

  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, ticket.userId)).limit(1);
  if (!account || !account.totpEnabled || !account.totpSecretEncrypted) {
    clearMfaTicket(res);
    return res.status(401).json({ error: "Sesi verifikasi tidak valid, silakan login ulang" });
  }

  const ip = req.ip ?? "unknown";
  const secret = decryptSecret(account.totpSecretEncrypted);
  let valid = verifyTotpCode(secret, code);

  if (!valid && account.totpBackupCodesHash?.length) {
    const remaining = consumeBackupCode(account.totpBackupCodesHash, code);
    if (remaining) {
      valid = true;
      await db.update(employeeAccounts).set({ totpBackupCodesHash: remaining }).where(eq(employeeAccounts.id, account.id));
    }
  }

  if (!valid) {
    await logLoginAttempt({ tenantId: account.tenantId, actorUserId: null, email: account.email, outcome: "failure", reason: "invalid_mfa_code", ip });
    return res.status(401).json({ error: "Kode verifikasi salah" });
  }

  clearMfaTicket(res);
  await issueSession(req, res, { userId: account.id, role: "employee", tenantId: account.tenantId, employeeId: account.employeeId, roleKey: account.roleKey });
  const [employee] = await db.select().from(employees).where(eq(employees.id, account.employeeId)).limit(1);
  res.json({ id: account.id, email: account.email, roleKey: account.roleKey, name: employee?.fullName ?? account.email });
});

employeeRouter.use(requireEmployeeSession);

/** Current MFA status for the logged-in employee — drives the ESS profile/security tab's "aktif/tidak aktif" state. */
employeeRouter.get("/mfa/status", async (req, res) => {
  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, req.session!.userId)).limit(1);
  if (!account) return res.status(401).json({ error: "Belum login" });
  res.json({ enabled: account.totpEnabled });
});

/** Starts (or restarts) enrollment — same half-finished-enrollment-can't-lock-anyone-out contract as authRouter's /mfa/setup. */
employeeRouter.post("/mfa/setup", async (req, res) => {
  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, req.session!.userId)).limit(1);
  if (!account) return res.status(401).json({ error: "Belum login" });
  if (account.totpEnabled) return res.status(400).json({ error: "MFA sudah aktif untuk akun ini. Matikan dulu sebelum mengatur ulang." });

  const secret = generateTotpSecret();
  await db.update(employeeAccounts).set({ totpSecretEncrypted: encryptSecret(secret) }).where(eq(employeeAccounts.id, account.id));

  const otpauthUrl = totpOtpauthUrl(secret, account.email, "NusaHR");
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  res.json({ secret, otpauthUrl, qrCodeDataUrl });
});

const employeeMfaConfirmSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

/** Completes enrollment: the code must match the secret /mfa/setup just stored before MFA turns on. Returns one-time backup codes — only their hashes are ever stored. */
employeeRouter.post("/mfa/confirm", validateBody(employeeMfaConfirmSchema), async (req, res) => {
  const { code } = req.body;
  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, req.session!.userId)).limit(1);
  if (!account) return res.status(401).json({ error: "Belum login" });
  if (account.totpEnabled) return res.status(400).json({ error: "MFA sudah aktif untuk akun ini." });
  if (!account.totpSecretEncrypted) return res.status(400).json({ error: "Belum ada proses pengaturan MFA yang berjalan. Mulai dari /mfa/setup." });

  const secret = decryptSecret(account.totpSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    return res.status(400).json({ error: "Kode verifikasi salah" });
  }

  const backupCodes = generateBackupCodes();
  await db
    .update(employeeAccounts)
    .set({ totpEnabled: true, totpBackupCodesHash: backupCodes.map(hashBackupCode) })
    .where(eq(employeeAccounts.id, account.id));
  await logAudit({ actorUserId: null, tenantId: account.tenantId, action: "auth.employee_mfa_enabled", details: { employeeAccountId: account.id } });

  res.json({ backupCodes });
});

const employeeMfaDisableSchema = z.object({
  password: z.string().min(1).max(200),
});

/** Turning MFA off requires the current password again — same unattended-unlocked-session defense as authRouter's /mfa/disable. */
employeeRouter.post("/mfa/disable", validateBody(employeeMfaDisableSchema), async (req, res) => {
  const { password } = req.body;
  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, req.session!.userId)).limit(1);
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    return res.status(401).json({ error: "Password salah" });
  }

  await db
    .update(employeeAccounts)
    .set({ totpEnabled: false, totpSecretEncrypted: null, totpBackupCodesHash: null })
    .where(eq(employeeAccounts.id, account.id));
  await logAudit({ actorUserId: null, tenantId: account.tenantId, action: "auth.employee_mfa_disabled", details: { employeeAccountId: account.id } });
  await sendSecurityAlert({
    tenantId: account.tenantId,
    subject: "MFA dinonaktifkan pada akun karyawan",
    message: `Verifikasi dua langkah (MFA) baru saja dinonaktifkan untuk akun karyawan ${account.email}. Jika ini bukan Anda, segera hubungi HR/Admin dan ganti password.`,
  });

  res.json({ ok: true });
});

employeeRouter.get("/me", async (req, res) => {
  const session = req.session!;
  const [employee] = await db.select().from(employees).where(eq(employees.id, session.employeeId!)).limit(1);
  if (!employee) return res.status(404).json({ error: "Data karyawan tidak ditemukan" });

  const permission = await getPermission(session.tenantId!, "attendance", session.roleKey!);
  res.json({ employee, roleKey: session.roleKey, permissions: { attendance: permission } });
});

// --- Own Attendance ---

employeeRouter.get("/attendance", requirePermission("attendance", "view"), async (req, res) => {
  const session = req.session!;
  const records = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, session.tenantId!), eq(attendanceRecords.employeeId, session.employeeId!)));
  res.json(records);
});

/**
 * "jam mulai clock in dan batas clock-in" (user, 2026-11-09) — a hard
 * window, not just a late-flag: outside it, clock-in/out is refused
 * outright. Compares against the server's local clock (same assumption
 * the rest of this app already makes about running in WIB — e.g.
 * Header.tsx's "Hari ini, {time} WIB" — not a new one introduced here).
 */
const geoCheckSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Pre-flight check the ESS popup calls the moment "Clock In"/"Clock Out"
 * is pressed, before showing the WFO/WFA/Perjalanan Dinas options — "Pilih
 * clock-in, otomatis deteksi di dalam radius atau diluar radius. Muncul
 * informasi..." (user, 2026-11-09). Read-only: never trust this result
 * for the actual commit, which re-derives everything server-side again.
 */
employeeRouter.post("/attendance/clock-in/check", requirePermission("attendance", "create"), validateBody(geoCheckSchema), async (req, res) => {
  const session = req.session!;
  try {
    res.json(await checkClockIn(session.tenantId!, session.employeeId!, req.body.lat, req.body.lng));
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

employeeRouter.post("/attendance/clock-out/check", requirePermission("attendance", "create"), validateBody(geoCheckSchema), async (req, res) => {
  const session = req.session!;
  res.json(await checkClockOut(session.tenantId!, session.employeeId!, req.body.lat, req.body.lng));
});

const clockInSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  workType: z.enum(["WFO", "WFA", "Perjalanan Dinas"]),
});

/** employeeId always the session's own, never client-supplied — the actual rule enforcement lives in lib/attendanceClock.ts, shared with the admin-context equivalent in tenant.ts. */
employeeRouter.post("/attendance/clock-in", requirePermission("attendance", "create"), validateBody(clockInSchema), async (req, res) => {
  const session = req.session!;
  try {
    const result = await performClockIn(session.tenantId!, session.employeeId!, req.body.lat, req.body.lng, req.body.workType);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

const clockOutSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

employeeRouter.post("/attendance/clock-out", requirePermission("attendance", "create"), validateBody(clockOutSchema), async (req, res) => {
  const session = req.session!;
  try {
    res.json(await performClockOut(session.tenantId!, session.employeeId!, req.body.lat, req.body.lng));
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

// --- Own Leave Requests ---

employeeRouter.get("/leave", requirePermission("attendance", "view"), async (req, res) => {
  const session = req.session!;
  const records = await db.select().from(leaveRequests).where(and(eq(leaveRequests.tenantId, session.tenantId!), eq(leaveRequests.employeeId, session.employeeId!)));
  res.json(records);
});

const leaveRequestSchema = z.object({
  leaveType: z.enum(["Cuti Tahunan", "Sakit Tanpa Surat Dokter", "Sakit dengan Surat Dokter", "Cuti Menikah", "Cuti Melahirkan", "Izin Urusan Pribadi"]),
  startDate: z.string().trim().min(1).max(20),
  endDate: z.string().trim().min(1).max(20),
  totalDays: z.number().int().min(1),
  reason: z.string().trim().max(1000).optional().nullable(),
  attachmentUrl: z.string().max(950_000).regex(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/, "Lampiran harus berupa gambar (PNG/JPG/WebP) atau PDF").optional().nullable(),
});

/** employeeId and status are never taken from the client — status always starts "Menunggu" and employeeId is always the session's own, so an employee can never file a leave request on someone else's behalf or pre-approve their own. */
employeeRouter.post("/leave", requirePermission("attendance", "create"), validateBody(leaveRequestSchema), async (req, res) => {
  const session = req.session!;
  if (req.body.leaveType === "Sakit dengan Surat Dokter" && !req.body.attachmentUrl) {
    return res.status(400).json({ error: "Surat dokter wajib dilampirkan untuk jenis izin Sakit dengan Surat Dokter.", details: { attachmentUrl: "Lampirkan surat dokter" } });
  }
  const [created] = await db
    .insert(leaveRequests)
    .values({ ...req.body, employeeId: session.employeeId!, tenantId: session.tenantId!, status: "Menunggu" })
    .returning();
  res.status(201).json(created);
});

// --- Manager Approval Queue (direct reports only) ---

/** "Atasan" here means direct reports only (employees.managerId === this manager's own employeeId) — not the full entity-visibility tree admins get, which is a different and much wider scope than "my team". */
employeeRouter.get("/approvals/leave", requirePermission("attendance", "approve"), async (req, res) => {
  const session = req.session!;
  const directReports = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.tenantId, session.tenantId!), eq(employees.managerId, session.employeeId!)));
  const reportIds = directReports.map((e) => e.id);
  if (reportIds.length === 0) return res.json([]);

  const pending = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.tenantId, session.tenantId!), eq(leaveRequests.status, "Menunggu")));
  res.json(pending.filter((r) => reportIds.includes(r.employeeId)));
});

const leaveDecisionSchema = z.object({
  decision: z.enum(["Disetujui", "Ditolak"]),
});

employeeRouter.post("/approvals/leave/:id/decision", requirePermission("attendance", "approve"), validateParams(uuidParam("id")), validateBody(leaveDecisionSchema), async (req, res) => {
  const session = req.session!;
  const [target] = await db.select().from(leaveRequests).where(and(eq(leaveRequests.id, req.params.id), eq(leaveRequests.tenantId, session.tenantId!))).limit(1);
  if (!target) return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan" });

  // Permission grants "can approve leave in general" — this checks the
  // specific target actually reports to this manager, the same
  // check-then-act pattern every admin route in tenant.ts uses for its
  // own visibility scope.
  const [targetEmployee] = await db.select({ managerId: employees.managerId }).from(employees).where(eq(employees.id, target.employeeId)).limit(1);
  if (!targetEmployee || targetEmployee.managerId !== session.employeeId) {
    return res.status(403).json({ error: "Karyawan ini bukan bawahan langsung Anda" });
  }

  const [manager] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, session.employeeId!)).limit(1);
  const [updated] = await db
    .update(leaveRequests)
    .set({ status: req.body.decision, approvedBy: manager?.fullName ?? session.employeeId })
    .where(eq(leaveRequests.id, target.id))
    .returning();

  await logAudit({ actorUserId: null, tenantId: session.tenantId, action: "leave.decision", details: { leaveRequestId: target.id, decision: req.body.decision, managerEmployeeId: session.employeeId } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Payroll — first module of the RBAC granular-enforcement rollout beyond
// attendance (security review, user 2026-11-10: "RBAC granular Harus
// diselesaikan"). Mirrors tenant.ts's /payroll-records routes exactly
// (same table, same validation shape) but reachable by an employee-role
// account whose roleKey has been granted the "payroll" module's
// view/create/edit permission in the RBAC matrix — e.g. a "Finance
// Supervisor" custom role who should be able to run payroll without
// needing the single tenant_admin owner login.
//
// Visibility scope: employee_accounts has no entity-scoping dimension at
// all today (unlike tenant_admin's `users.entityId` vertical scope), so a
// granted "payroll" permission is tenant-wide, not limited to one entity —
// this is a deliberate, documented default pending a real entity-scoping
// concept for employee accounts, not an oversight.
// ---------------------------------------------------------------------------

const employeePayrollRecordSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().trim().min(1).max(100),
  basicSalary: z.number().int().min(0).optional(),
  allowances: z.number().int().min(0).optional(),
  overtimePay: z.number().int().min(0).optional(),
  reimbursement: z.number().int().min(0).optional(),
  thrBonus: z.number().int().min(0).optional(),
  grossPay: z.number().int().min(0).optional(),
  bpjsKesCompany: z.number().int().min(0).optional(),
  bpjsKesEmployee: z.number().int().min(0).optional(),
  bpjsTkCompany: z.number().int().min(0).optional(),
  bpjsTkEmployee: z.number().int().min(0).optional(),
  pph21TERCategory: z.enum(["TER A", "TER B", "TER C"]).optional(),
  pph21RatePercent: z.number().min(0).optional(),
  pph21Amount: z.number().int().min(0).optional(),
  loanDeduction: z.number().int().min(0).optional(),
  lateDeduction: z.number().int().min(0).optional(),
  unpaidLeaveDeduction: z.number().int().min(0).optional().nullable(),
  severancePay: z.number().int().min(0).optional().nullable(),
  totalDeductions: z.number().int().min(0).optional(),
  netPay: z.number().int().min(0).optional(),
  status: z.enum(["Draft", "Approved", "Disbursed"]).optional(),
  paidDate: z.string().trim().max(20).optional().nullable(),
});

employeeRouter.get("/payroll-records", requirePermission("payroll", "view"), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(payrollRecords).where(eq(payrollRecords.tenantId, tenantId)));
});

/** Upsert by (employeeId, period) — same replace-not-duplicate contract as tenant.ts's admin route. */
employeeRouter.post("/payroll-records/upsert", requirePermission("payroll", "create"), validateBody(employeePayrollRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db
    .select()
    .from(payrollRecords)
    .where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.employeeId, req.body.employeeId), eq(payrollRecords.period, req.body.period)))
    .limit(1);
  if (existing) {
    const [updated] = await db.update(payrollRecords).set(req.body).where(eq(payrollRecords.id, existing.id)).returning();
    await logAudit({ actorUserId: null, tenantId, action: "payroll.record_upserted", details: { payrollRecordId: updated.id, employeeAccountId: req.session!.userId } });
    return res.json(updated);
  }
  const [created] = await db.insert(payrollRecords).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "payroll.record_upserted", details: { payrollRecordId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/payroll-records/:id", requirePermission("payroll", "edit"), validateParams(uuidParam("id")), validateBody(employeePayrollRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(payrollRecords).where(and(eq(payrollRecords.id, req.params.id), eq(payrollRecords.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Data payroll tidak ditemukan" });
  const [updated] = await db.update(payrollRecords).set(req.body).where(eq(payrollRecords.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "payroll.record_updated", details: { payrollRecordId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// GA Assets — second module of the RBAC granular-enforcement rollout
// (moduleKey "assets" in the RBAC matrix). Mirrors tenant.ts's /ga-assets
// core CRUD; maintenance tickets and relocations stay admin-only for now
// (tracked as a follow-up, not silently dropped).
// ---------------------------------------------------------------------------

const employeeGaAssetSchema = z.object({
  assetCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  category: z.enum(["Laptop & Komputer", "Kendaraan Operasional", "Fasilitas Gedung", "Furniture", "Perangkat Jaringan"]),
  building: z.string().trim().min(1).max(200),
  room: z.string().trim().min(1).max(200),
  purchaseDate: z.string().trim().min(1).max(20),
  purchasePrice: z.number().int().min(0),
  condition: z.enum(["Baik", "Perlu Perbaikan", "Rusak", "Dipinjam", "Hilang"]).optional(),
  assignedToEmployeeId: z.string().uuid().optional().nullable(),
  lastStockOpname: z.string().trim().min(1).max(20),
  qrPayload: z.string().trim().min(1).max(2000),
  usageStatus: z.enum(["Tersedia", "Digunakan", "Dalam Perbaikan"]).optional().nullable(),
});

employeeRouter.get("/ga-assets", requirePermission("assets", "view"), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(gaAssets).where(eq(gaAssets.tenantId, tenantId)));
});

employeeRouter.post("/ga-assets", requirePermission("assets", "create"), validateBody(employeeGaAssetSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(gaAssets).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "ga_asset.created", details: { assetId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/ga-assets/:id", requirePermission("assets", "edit"), validateParams(uuidParam("id")), validateBody(employeeGaAssetSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gaAssets).where(and(eq(gaAssets.id, req.params.id), eq(gaAssets.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Aset tidak ditemukan" });
  const [updated] = await db.update(gaAssets).set(req.body).where(eq(gaAssets.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "ga_asset.updated", details: { assetId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Procurement — third module of the RBAC rollout (moduleKey "procurement").
// ---------------------------------------------------------------------------

const employeeProcurementOrderSchema = z.object({
  type: z.enum(["Pengadaan Barang", "Project / Jasa", "Barang", "Proyek / Jasa Kontrak"]).optional().nullable(),
  prNumber: z.string().trim().min(1).max(100),
  poNumber: z.string().trim().max(100).optional(),
  quotationNumber: z.string().trim().max(100).optional().nullable(),
  contractNumber: z.string().trim().max(100).optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  vendorName: z.string().trim().min(1).max(200),
  itemName: z.string().trim().min(1).max(500),
  quantity: z.number().int().min(1),
  estimatedCost: z.number().int().min(0),
  requestor: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(200),
  status: z.enum(["Pengajuan PR", "Quotation Diterima", "Disetujui HR/Finance", "PO Terbit", "Kontrak Berjalan", "Barang Diterima / Project Selesai", "Barang Diterima"]).optional(),
  requestedDate: z.string().trim().min(1).max(20),
});

employeeRouter.get("/procurement-orders", requirePermission("procurement", "view"), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(procurementOrders).where(eq(procurementOrders.tenantId, tenantId)));
});

employeeRouter.post("/procurement-orders", requirePermission("procurement", "create"), validateBody(employeeProcurementOrderSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(procurementOrders).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "procurement_order.created", details: { orderId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/procurement-orders/:id", requirePermission("procurement", "edit"), validateParams(uuidParam("id")), validateBody(employeeProcurementOrderSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(procurementOrders).where(and(eq(procurementOrders.id, req.params.id), eq(procurementOrders.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Procurement order tidak ditemukan" });
  const [updated] = await db.update(procurementOrders).set(req.body).where(eq(procurementOrders.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "procurement_order.updated", details: { orderId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Compliance — fourth module of the RBAC rollout (moduleKey "compliance").
// ---------------------------------------------------------------------------

const employeeComplianceRecordSchema = z.object({
  employeeId: z.string().uuid(),
  level: z.enum(["SP 1", "SP 2", "SP 3", "Skorsing", "PHK"]),
  violationReason: z.string().trim().min(1).max(2000),
  letterNumber: z.string().trim().min(1).max(200),
  issueDate: z.string().trim().min(1).max(20),
  validUntil: z.string().trim().min(1).max(20),
  signedBy: z.string().trim().max(200).optional().nullable(),
  status: z.enum(["Aktif", "Kedaluwarsa", "Dibatalkan"]).optional(),
});

employeeRouter.get("/compliance-records", requirePermission("compliance", "view"), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(complianceRecords).where(eq(complianceRecords.tenantId, tenantId)));
});

employeeRouter.post("/compliance-records", requirePermission("compliance", "create"), validateBody(employeeComplianceRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(complianceRecords).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "compliance_record.created", details: { recordId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/compliance-records/:id", requirePermission("compliance", "edit"), validateParams(uuidParam("id")), validateBody(employeeComplianceRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(complianceRecords).where(and(eq(complianceRecords.id, req.params.id), eq(complianceRecords.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Data kepatuhan tidak ditemukan" });
  const [updated] = await db.update(complianceRecords).set(req.body).where(eq(complianceRecords.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "compliance_record.updated", details: { recordId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Loans & Kasbon — fifth module of the RBAC rollout (moduleKey "loans").
// ---------------------------------------------------------------------------

const employeeLoanRecordSchema = z.object({
  employeeId: z.string().uuid(),
  loanType: z.string().trim().min(1).max(100),
  totalAmount: z.number().int().min(0),
  tenorMonths: z.number().int().min(1),
  monthlyInstallment: z.number().int().min(0),
  remainingAmount: z.number().int().min(0).optional(),
  startDate: z.string().trim().min(1).max(20),
  reason: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["Aktif", "Lunas", "Menunggu Approval", "Ditolak"]).optional(),
  adminFee: z.number().int().min(0).optional().nullable(),
  interestMethod: z.string().trim().max(100).optional().nullable(),
  interestRatePercent: z.number().min(0).optional().nullable(),
});

employeeRouter.get("/loans", requirePermission("loans", "view"), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(employeeLoans).where(eq(employeeLoans.tenantId, tenantId)));
});

employeeRouter.post("/loans", requirePermission("loans", "create"), validateBody(employeeLoanRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db
    .insert(employeeLoans)
    .values({ ...req.body, remainingAmount: req.body.remainingAmount ?? req.body.totalAmount, tenantId })
    .returning();
  await logAudit({ actorUserId: null, tenantId, action: "loan.created", details: { loanId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/loans/:id", requirePermission("loans", "edit"), validateParams(uuidParam("id")), validateBody(employeeLoanRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(employeeLoans).where(and(eq(employeeLoans.id, req.params.id), eq(employeeLoans.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Data pinjaman tidak ditemukan" });
  const [updated] = await db.update(employeeLoans).set(req.body).where(eq(employeeLoans.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "loan.updated", details: { loanId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});


// ---------------------------------------------------------------------------
// RBAC granular-enforcement rollout, phase 2 — remaining matrix modules
// (employees, trips, kpi, recruitment, offboarding, calendar, audit_trail,
// approvals, documents). Same contract as phase 1: schemas mirror tenant.ts,
// every query is tenant-scoped by the session, no entity scoping (employee
// accounts have no entity dimension — documented default), writes audited.
// "personalia" is now served below (personalia_actions table).
// Deliberately skipped: POST /job-requisitions (job_requisitions.requested_by_user_id is a NOT NULL
// FK to users, which an employee account has no row in — needs a schema
// decision, not a silent workaround).
// ---------------------------------------------------------------------------

const zDateTime = () => z.string().datetime().transform((v) => new Date(v));

async function assertEntityInTenant(tenantId: string, entityId: string | null | undefined): Promise<boolean> {
  if (!entityId) return true;
  const [row] = await db.select({ id: companyEntities.id }).from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  return Boolean(row);
}

// --- Employees (moduleKey "employees") ---
const employeeRecordSchema = z.object({
  entityId: z.string().uuid(),
  nik: z.string().trim().min(1).max(50),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  avatar: z.string().trim().max(2000).optional().nullable(),
  employmentType: z.string().trim().max(50).optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  divisionId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  orgNodeId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  candidateId: z.string().uuid().optional().nullable(),
  status: z.string().trim().max(50).optional().nullable(),
  basicSalary: z.number().int().min(0).optional().nullable(),
  joinDate: zDateTime().optional().nullable(),
  resignDate: zDateTime().optional().nullable(),
  resignReason: z.string().trim().max(500).optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional(),
});

employeeRouter.get("/employees", requirePermission("employees", "view"), async (req, res) => {
  res.json(await db.select().from(employees).where(eq(employees.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/employees", requirePermission("employees", "create"), validateBody(employeeRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [created] = await db.insert(employees).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "employee.create", details: { employeeId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/employees/:id", requirePermission("employees", "edit"), validateParams(uuidParam("id")), validateBody(employeeRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(employees).where(and(eq(employees.id, req.params.id), eq(employees.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [updated] = await db.update(employees).set(req.body).where(eq(employees.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "employee.update", details: { employeeId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// --- Business Trips / SPPD (moduleKey "trips") ---
const employeeBusinessTripSchema = z.object({
  tripNumber: z.string().trim().min(1).max(100),
  employeeId: z.string().uuid(),
  destinationCity: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(1).max(20),
  endDate: z.string().trim().min(1).max(20),
  totalDays: z.number().int().min(1),
  purpose: z.string().trim().min(1).max(2000),
  transportType: z.enum(["Pesawat", "Kereta Api", "Mobil Operasional", "Travel"]),
  estimatedCost: z.number().int().min(0),
  perDiemDaily: z.number().int().min(0),
  accommodationCost: z.number().int().min(0),
  status: z.enum(["Menunggu Approval", "Disetujui Atasan", "Disetujui Finance", "Selesai", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional().nullable(),
});

employeeRouter.get("/business-trips", requirePermission("trips", "view"), async (req, res) => {
  res.json(await db.select().from(businessTrips).where(eq(businessTrips.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/business-trips", requirePermission("trips", "create"), validateBody(employeeBusinessTripSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [target] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, req.body.employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!target) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  const [created] = await db.insert(businessTrips).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "business_trip.created", details: { tripId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/business-trips/:id", requirePermission("trips", "edit"), validateParams(uuidParam("id")), validateBody(employeeBusinessTripSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(businessTrips).where(and(eq(businessTrips.id, req.params.id), eq(businessTrips.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Data perjalanan dinas tidak ditemukan" });
  const [updated] = await db.update(businessTrips).set(req.body).where(eq(businessTrips.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "business_trip.updated", details: { tripId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// --- KPI (moduleKey "kpi") ---
const employeeKpiRecordSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().trim().min(1).max(100),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  metrics: z.array(z.unknown()).optional(),
  finalScore: z.number().optional(),
  feedback: z.string().trim().max(2000).optional().nullable(),
  reviewer: z.string().trim().max(200).optional().nullable(),
  evaluatedAt: z.string().trim().min(1).max(20),
});

employeeRouter.get("/employee-kpis", requirePermission("kpi", "view"), async (req, res) => {
  res.json(await db.select().from(employeeKpis).where(eq(employeeKpis.tenantId, req.session!.tenantId!)));
});

/** Upsert by (employeeId, quarter, period) — same replace-not-duplicate contract as tenant.ts. A create/edit permission is required either way, checked per outcome below. */
employeeRouter.post("/employee-kpis/upsert", requirePermission("kpi", "create"), validateBody(employeeKpiRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [target] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, req.body.employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!target) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  // Only the person's real superiors (or an HR role granted kpi "approve") may assess them — never themselves, never an arbitrary peer.
  const assessorId = req.session!.employeeId!;
  if (assessorId === target.id) return res.status(403).json({ error: "Anda tidak dapat menilai KPI diri sendiri." });
  const kpiPerm = await getPermission(tenantId, "kpi", req.session!.roleKey!);
  if (!kpiPerm.approve && !(await isInManagerChain(tenantId, assessorId, target.id))) {
    return res.status(403).json({ error: "KPI hanya dapat dinilai oleh atasan langsung/atasan di atasnya atau peran HR yang berwenang." });
  }
  const [assessor] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, assessorId)).limit(1);
  req.body.reviewer = assessor?.fullName ?? req.body.reviewer;
  const [existing] = await db
    .select()
    .from(employeeKpis)
    .where(and(eq(employeeKpis.tenantId, tenantId), eq(employeeKpis.employeeId, req.body.employeeId), eq(employeeKpis.quarter, req.body.quarter), eq(employeeKpis.period, req.body.period)))
    .limit(1);
  if (existing) {
    // Replacing an existing review is an edit, not a create.
    const perm = await getPermission(tenantId, "kpi", req.session!.roleKey!);
    if (!perm.edit) return res.status(403).json({ error: "Anda tidak memiliki izin untuk tindakan ini" });
    const [updated] = await db.update(employeeKpis).set(req.body).where(eq(employeeKpis.id, existing.id)).returning();
    await logAudit({ actorUserId: null, tenantId, action: "employee_kpi.updated", details: { kpiId: updated.id, employeeAccountId: req.session!.userId } });
    return res.json(updated);
  }
  const [created] = await db.insert(employeeKpis).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "employee_kpi.created", details: { kpiId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

// --- Recruitment (moduleKey "recruitment"): requisitions (no POST, see header), vacancies, candidates ---
const employeeJobRequisitionSchema = z.object({
  entityId: z.string().uuid(),
  officeLocationId: z.string().uuid().optional(),
  divisionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  requisitionType: z.enum(["Baru", "Penggantian"]).optional(),
  replacementEmployeeId: z.string().uuid().optional(),
  headcount: z.number().int().min(1).optional(),
  educationLevelId: z.string().uuid().optional(),
  fieldsOfStudyIds: z.array(z.string().uuid()).optional(),
  minExperienceYears: z.number().int().min(0).optional(),
  knockoutCriteria: z.array(z.unknown()).optional(),
  scoredCriteria: z.array(z.unknown()).optional(),
  signatories: z.array(z.unknown()).optional(),
  status: z.enum(["Draft", "Menunggu Approval", "Disetujui", "Ditolak", "Dibatalkan", "Dicabut (Retracted)"]).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

employeeRouter.get("/job-requisitions", requirePermission("recruitment", "view"), async (req, res) => {
  res.json(await db.select().from(jobRequisitions).where(eq(jobRequisitions.tenantId, req.session!.tenantId!)));
});

employeeRouter.put("/job-requisitions/:id", requirePermission("recruitment", "edit"), validateParams(uuidParam("id")), validateBody(employeeJobRequisitionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(jobRequisitions).where(and(eq(jobRequisitions.id, req.params.id), eq(jobRequisitions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "FPTK tidak ditemukan" });
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [updated] = await db.update(jobRequisitions).set(req.body).where(eq(jobRequisitions.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "job_requisition.update", details: { jobRequisitionId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

const employeeJobVacancySchema = z.object({
  entityId: z.string().uuid(),
  jobRequisitionId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  openings: z.number().int().min(1).optional(),
  status: z.enum(["Buka", "Ditutup"]).optional(),
  targetCloseDate: zDateTime().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

employeeRouter.get("/job-vacancies", requirePermission("recruitment", "view"), async (req, res) => {
  res.json(await db.select().from(jobVacancies).where(eq(jobVacancies.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/job-vacancies", requirePermission("recruitment", "create"), validateBody(employeeJobVacancySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [created] = await db.insert(jobVacancies).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "job_vacancy.create", details: { jobVacancyId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/job-vacancies/:id", requirePermission("recruitment", "edit"), validateParams(uuidParam("id")), validateBody(employeeJobVacancySchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(jobVacancies).where(and(eq(jobVacancies.id, req.params.id), eq(jobVacancies.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [updated] = await db.update(jobVacancies).set(req.body).where(eq(jobVacancies.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "job_vacancy.update", details: { jobVacancyId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

const employeeCandidateSchema = z.object({
  jobVacancyId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional(),
  stage: z.string().trim().min(1).max(100).optional(),
  aiMatchScore: z.number().int().min(0).max(100).optional(),
  testScore: z.number().int().min(0).max(100).optional(),
  interviewScore: z.number().int().min(0).max(100).optional(),
  offeredSalary: z.number().int().min(0).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

employeeRouter.get("/candidates", requirePermission("recruitment", "view"), async (req, res) => {
  res.json(await db.select().from(candidates).where(eq(candidates.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/candidates", requirePermission("recruitment", "create"), validateBody(employeeCandidateSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [vacancy] = await db.select({ id: jobVacancies.id }).from(jobVacancies).where(and(eq(jobVacancies.id, req.body.jobVacancyId), eq(jobVacancies.tenantId, tenantId))).limit(1);
  if (!vacancy) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  const [created] = await db.insert(candidates).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "candidate.create", details: { candidateId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/candidates/:id", requirePermission("recruitment", "edit"), validateParams(uuidParam("id")), validateBody(employeeCandidateSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select({ id: candidates.id }).from(candidates).where(and(eq(candidates.id, req.params.id), eq(candidates.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Kandidat tidak ditemukan" });
  if (req.body.jobVacancyId) {
    const [vacancy] = await db.select({ id: jobVacancies.id }).from(jobVacancies).where(and(eq(jobVacancies.id, req.body.jobVacancyId), eq(jobVacancies.tenantId, tenantId))).limit(1);
    if (!vacancy) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  }
  const [updated] = await db.update(candidates).set(req.body).where(eq(candidates.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "candidate.update", details: { candidateId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// --- Offboarding (moduleKey "offboarding") ---
const employeeOffboardingSchema = z.object({
  employeeId: z.string().uuid(),
  separationType: z.enum(["Resign Sukarela", "Habis Kontrak", "PHK Efisiensi", "PHK Indisipliner"]),
  requestDate: z.string().trim().min(1).max(20),
  effectiveDate: z.string().trim().min(1).max(20),
  handoverCompleted: z.boolean().optional(),
  assetReturned: z.boolean().optional(),
  financeCleared: z.boolean().optional(),
  severancePay: z.number().int().min(0).optional(),
  parklaringIssued: z.boolean().optional(),
  parklaringNumber: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

employeeRouter.get("/offboarding-records", requirePermission("offboarding", "view"), async (req, res) => {
  res.json(await db.select().from(offboardingRecords).where(eq(offboardingRecords.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/offboarding-records", requirePermission("offboarding", "create"), validateBody(employeeOffboardingSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [target] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, req.body.employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!target) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  const [created] = await db.insert(offboardingRecords).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "offboarding.created", details: { recordId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.put("/offboarding-records/:id", requirePermission("offboarding", "edit"), validateParams(uuidParam("id")), validateBody(employeeOffboardingSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(offboardingRecords).where(and(eq(offboardingRecords.id, req.params.id), eq(offboardingRecords.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Data offboarding tidak ditemukan" });
  const [updated] = await db.update(offboardingRecords).set(req.body).where(eq(offboardingRecords.id, req.params.id)).returning();
  await logAudit({ actorUserId: null, tenantId, action: "offboarding.updated", details: { recordId: updated.id, employeeAccountId: req.session!.userId } });
  res.json(updated);
});

// --- Calendar (moduleKey "calendar") ---
const employeeCalendarEventSchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(20),
  type: z.enum(["Cuti Bersama", "Libur Nasional", "Event", "Libur Perusahaan", "Cuti Bersama Perusahaan"]),
  deductsLeaveBucket: z.boolean().optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

employeeRouter.get("/calendar-events", requirePermission("calendar", "view"), async (req, res) => {
  res.json(await db.select().from(companyCalendarEvents).where(eq(companyCalendarEvents.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/calendar-events", requirePermission("calendar", "create"), validateBody(employeeCalendarEventSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (!(await assertEntityInTenant(tenantId, req.body.entityId))) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [created] = await db.insert(companyCalendarEvents).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: null, tenantId, action: "calendar_event.created", details: { eventId: created.id, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

// --- Audit trail (moduleKey "audit_trail") — read-only for this tier; entries are written by the system, never by staff accounts. ---
employeeRouter.get("/audit-trail", requirePermission("audit_trail", "view"), async (req, res) => {
  res.json(
    await db.select().from(auditTrailEntries).where(eq(auditTrailEntries.tenantId, req.session!.tenantId!)).orderBy(desc(auditTrailEntries.timestamp)).limit(2000)
  );
});

// --- Approvals (moduleKey "approvals") — tenant-wide queue, same as tenant.ts. Deciding/editing an item needs the 'approve' action. ---

/**
 * Approval queue for an employee approver: only items whose CURRENT step is
 * theirs (or one they hold an active delegation for), never the whole
 * tenant queue — plus the full queue for a role explicitly granted
 * "approvals: view" in the matrix (e.g. an HR/Finance controller).
 */
employeeRouter.get("/approval-items", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const me = req.session!.employeeId!;
  const rows = await db.select().from(approvalItems).where(eq(approvalItems.tenantId, tenantId));
  const permission = await getPermission(tenantId, "approvals", req.session!.roleKey ?? "");
  if (permission.view) return res.json(rows.map((r) => withDerivedStatus(r)));
  const delegators = await activeDelegatorIds(tenantId, me);
  const mine = rows.filter((r) => {
    const step = currentBlockingStep(r.steps);
    const approver = step?.approverEmployeeId;
    return approver === me || (approver ? delegators.includes(approver) : false) || r.requesterId === me;
  });
  res.json(mine.map((r) => withDerivedStatus(r)));
});

const employeeApprovalDecisionSchema = z.object({
  decision: z.enum(["Disetujui", "Ditolak", "Diketahui"]),
  reason: z.string().trim().max(2000).optional().nullable(),
});

/** The only way an employee moves an approval forward: the engine verifies they are the current step's approver (or an active delegate), forbids self-approval, and requires a reason to reject. The generic status-PUT that used to exist here is gone — it could force-approve anything. */
employeeRouter.post("/approval-items/:id/decision", validateParams(uuidParam("id")), validateBody(employeeApprovalDecisionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const session = req.session!;
  const [me] = await db.select({ fullName: employees.fullName }).from(employees).where(eq(employees.id, session.employeeId!)).limit(1);
  try {
    const updated = await decideApproval({
      tenantId,
      itemId: req.params.id,
      actor: {
        kind: "employee",
        employeeId: session.employeeId!,
        name: me?.fullName ?? "Karyawan",
        // A role-based step (no named approver) is open to holders of that roleKey.
        hasRolePermission: async (roleKey) => session.roleKey === roleKey,
      },
      decision: req.body.decision,
      reason: req.body.reason,
    });
    await logAudit({ actorUserId: null, tenantId, action: "approval_item.decision", details: { approvalItemId: updated.id, decision: req.body.decision, status: updated.status, employeeAccountId: session.userId } });
    res.json(withDerivedStatus(updated));
  } catch (err) {
    if (err instanceof ApprovalError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

// --- Personalia (moduleKey "personalia") — same server logic as tenant.ts; the decision itself still goes through the approval engine. ---
employeeRouter.get("/personalia-actions", requirePermission("personalia", "view"), async (req, res) => {
  res.json(await listPersonaliaActions(req.session!.tenantId!, typeof req.query.employeeId === "string" ? req.query.employeeId : undefined));
});
employeeRouter.post("/personalia-actions", requirePermission("personalia", "create"), validateBody(personaliaActionSchema), async (req, res) => {
  try {
    res.status(201).json(await createPersonaliaAction({ tenantId: req.session!.tenantId!, actorUserId: null, input: req.body }));
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
employeeRouter.post("/personalia-actions/:id/submit", requirePermission("personalia", "create"), validateParams(uuidParam("id")), async (req, res) => {
  try {
    res.json(await submitPersonaliaAction({ tenantId: req.session!.tenantId!, actionId: req.params.id, actorUserId: null }));
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
employeeRouter.delete("/personalia-actions/:id", requirePermission("personalia", "delete"), validateParams(uuidParam("id")), async (req, res) => {
  try {
    await deletePersonaliaDraft(req.session!.tenantId!, req.params.id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

// --- Documents (moduleKey "documents") — same server-computed status/QR/signatory
// logic as tenant.ts: the client can never assert status or qrVerificationUrl. ---
type EmployeeDocSignatory = typeof officialDocuments.$inferSelect["signatories"][number];

function docIsFullySigned(signatories: EmployeeDocSignatory[]): boolean {
  return signatories.filter((s) => s.isRequired).every((s) => s.confirmedAt);
}

function docBuildVerificationUrl(documentNumber: string): string {
  const cleanNumber = documentNumber.replace(/[\/\s]/g, "-");
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `https://nusahr.enterprise/verify?doc=${cleanNumber}&h=${hash}`;
}

const employeeOfficialDocumentSchema = z.object({
  documentNumber: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(200),
  templateId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(400),
  targetEmployeeId: z.string().uuid().optional().nullable(),
  issueDate: z.string().trim().min(1).max(20),
  signeeName: z.string().trim().min(1).max(200),
  signeeRole: z.string().trim().min(1).max(200),
  contentPreview: z.string().max(500000),
  renderedHtml: z.string().max(2000000).optional().nullable(),
  isFromDocxTemplate: z.boolean().optional(),
});

employeeRouter.get("/documents", requirePermission("documents", "view"), async (req, res) => {
  res.json(await db.select().from(officialDocuments).where(eq(officialDocuments.tenantId, req.session!.tenantId!)));
});

employeeRouter.post("/documents", requirePermission("documents", "create"), validateBody(employeeOfficialDocumentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (req.body.templateId) {
    const [tmpl] = await db.select({ id: documentTemplates.id }).from(documentTemplates).where(and(eq(documentTemplates.id, req.body.templateId), eq(documentTemplates.tenantId, tenantId))).limit(1);
    if (!tmpl) return res.status(404).json({ error: "Template dokumen tidak ditemukan" });
  }
  if (req.body.targetEmployeeId) {
    const [target] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, req.body.targetEmployeeId), eq(employees.tenantId, tenantId))).limit(1);
    if (!target) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  }

  const configs = await db
    .select()
    .from(documentSignatoryConfigs)
    .where(and(eq(documentSignatoryConfigs.tenantId, tenantId), eq(documentSignatoryConfigs.documentType, req.body.type)))
    .orderBy(documentSignatoryConfigs.sortOrder);

  const signatories: EmployeeDocSignatory[] =
    configs.length > 0
      ? configs.map((c) => ({ roleLabel: c.roleLabel, isRequired: c.isRequired, sortOrder: c.sortOrder, confirmedByEmployeeId: null, confirmedByName: null, confirmedAt: null }))
      : [{ roleLabel: req.body.signeeRole, isRequired: true, sortOrder: 0, confirmedByEmployeeId: null, confirmedByName: null, confirmedAt: null }];

  const alreadyComplete = docIsFullySigned(signatories);
  const [created] = await db
    .insert(officialDocuments)
    .values({
      ...req.body,
      tenantId,
      signatories,
      status: alreadyComplete ? "Resmi Diterbitkan" : "Menunggu Tanda Tangan",
      qrVerificationUrl: alreadyComplete ? docBuildVerificationUrl(req.body.documentNumber) : null,
    })
    .returning();
  await logAudit({ actorUserId: null, tenantId, action: "document.created", details: { documentId: created.id, type: created.type, signatoryCount: signatories.length, employeeAccountId: req.session!.userId } });
  res.status(201).json(created);
});

employeeRouter.post(
  "/documents/:id/signatories/:index/confirm",
  requirePermission("documents", "approve"),
  validateParams(z.object({ id: z.string().uuid(), index: z.coerce.number().int().min(0) })),
  validateBody(z.object({ confirmedByName: z.string().trim().min(1).max(200).optional() })),
  async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const index = Number(req.params.index);
    const [doc] = await db.select().from(officialDocuments).where(and(eq(officialDocuments.id, req.params.id), eq(officialDocuments.tenantId, tenantId))).limit(1);
    if (!doc) return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    if (doc.status === "Resmi Diterbitkan") return res.status(400).json({ error: "Dokumen ini sudah resmi diterbitkan, seluruh tanda tangan sudah lengkap." });

    const signatories = [...doc.signatories];
    if (!signatories[index]) return res.status(404).json({ error: "Slot penandatangan tidak ditemukan" });
    if (signatories[index].confirmedAt) return res.status(400).json({ error: "Slot penandatangan ini sudah dikonfirmasi sebelumnya." });

    signatories[index] = {
      ...signatories[index],
      confirmedByEmployeeId: req.session!.employeeId ?? null,
      confirmedByName: req.body.confirmedByName?.trim() || doc.signeeName,
      confirmedAt: new Date().toISOString(),
    };

    const nowComplete = docIsFullySigned(signatories);
    const [updated] = await db
      .update(officialDocuments)
      .set({
        signatories,
        status: nowComplete ? "Resmi Diterbitkan" : doc.status,
        qrVerificationUrl: nowComplete ? docBuildVerificationUrl(doc.documentNumber) : doc.qrVerificationUrl,
      })
      .where(eq(officialDocuments.id, doc.id))
      .returning();

    await logAudit({
      actorUserId: null,
      tenantId,
      action: nowComplete ? "document.fully_signed_issued" : "document.signatory_confirmed",
      details: { documentId: doc.id, signatoryIndex: index, roleLabel: signatories[index].roleLabel, employeeAccountId: req.session!.userId },
    });
    res.json(updated);
  }
);
