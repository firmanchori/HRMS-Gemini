import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employeeAccounts, employees, attendanceRecords, leaveRequests } from "../db/schema.ts";
import { issueSession, requireEmployeeSession, requirePermission } from "../middleware/auth.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { authLimiter } from "../lib/rateLimit.ts";
import { logAudit } from "../lib/audit.ts";
import { logLoginAttempt, isAccountLockedOut, LOCKOUT_WINDOW_MINUTES } from "./auth.ts";
import { getPermission } from "../lib/permissions.ts";

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

  await logLoginAttempt({ tenantId, actorUserId: null, email, outcome: "success", ip });
  issueSession(res, { userId: account.id, role: "employee", tenantId, employeeId: account.employeeId, roleKey: account.roleKey });

  const [employee] = await db.select().from(employees).where(eq(employees.id, account.employeeId)).limit(1);
  res.json({ id: account.id, email: account.email, roleKey: account.roleKey, name: employee?.fullName ?? account.email });
});

employeeRouter.use(requireEmployeeSession);

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

const clockSchema = z.object({
  date: z.string().trim().min(1).max(20),
  clockIn: z.string().trim().max(10).optional(),
  clockOut: z.string().trim().max(10).optional(),
  workType: z.enum(["WFO", "WFH", "WFA"]),
  notes: z.string().trim().max(1000).optional(),
});

/** Upsert by (own employeeId, date) — the same "find today's row or create it" shape as the admin-side /attendance-records/upsert, but the employeeId is always the session's own, never client-supplied. */
employeeRouter.post("/attendance/clock", requirePermission("attendance", "create"), validateBody(clockSchema), async (req, res) => {
  const session = req.session!;
  const employeeId = session.employeeId!;
  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.tenantId, session.tenantId!), eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, req.body.date)))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(attendanceRecords).set(req.body).where(eq(attendanceRecords.id, existing.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(attendanceRecords).values({ ...req.body, employeeId, tenantId: session.tenantId! }).returning();
  res.status(201).json(created);
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
