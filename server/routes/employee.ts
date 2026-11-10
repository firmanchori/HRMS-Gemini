import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "../db/client.ts";
import { employeeAccounts, employees, attendanceRecords, leaveRequests, payrollRecords, gaAssets, procurementOrders, complianceRecords, employeeLoans } from "../db/schema.ts";
import { issueSession, requireEmployeeSession, requirePermission, issueMfaTicket, readMfaTicket, clearMfaTicket } from "../middleware/auth.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { authLimiter } from "../lib/rateLimit.ts";
import { logAudit } from "../lib/audit.ts";
import { logLoginAttempt, isAccountLockedOut, LOCKOUT_WINDOW_MINUTES, alertIfAccountJustLockedOut } from "./auth.ts";
import { getPermission } from "../lib/permissions.ts";
import { checkClockIn, checkClockOut, performClockIn, performClockOut, ClockError } from "../lib/attendanceClock.ts";
import { encryptSecret, decryptSecret } from "../lib/crypto.ts";
import { generateTotpSecret, totpOtpauthUrl, verifyTotpCode, generateBackupCodes, hashBackupCode, consumeBackupCode } from "../lib/totp.ts";
import { sendSecurityAlert } from "../lib/alerts.ts";

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
});

/** employeeId and status are never taken from the client — status always starts "Menunggu" and employeeId is always the session's own, so an employee can never file a leave request on someone else's behalf or pre-approve their own. */
employeeRouter.post("/leave", requirePermission("attendance", "create"), validateBody(leaveRequestSchema), async (req, res) => {
  const session = req.session!;
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
