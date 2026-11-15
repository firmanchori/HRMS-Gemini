import { Router } from "express";
import { z } from "zod";
import { and, eq, or, ne, inArray, gte, lte } from "drizzle-orm";
import { db } from "../db/client.ts";
import { leaveRequests, overtimeRequests, employeeLoans, attendanceCorrectionRequests, shiftSwapRequests, businessTrips, officialDocuments, employees, attendanceRecords, approvalDelegations } from "../db/schema.ts";
import { nowWib } from "../lib/dates.ts";
import { validateBody } from "../lib/validate.ts";
import { requirePermission } from "../middleware/auth.ts";
import { getLeaveBalance } from "../lib/leaveBalance.ts";
import { RequestError, overtimeInputSchema, loanInputSchema, correctionInputSchema, swapInputSchema, tripInputSchema, submitOvertimeRequest, submitLoanRequest, submitAttendanceCorrection, submitShiftSwapRequest, submitBusinessTrip } from "../lib/requests.ts";

/**
 * Employee self-service requests. The employee is always the session's own (never a body field), the status is always pending, and
 * the decision belongs to the Approval Engine. Mounted at /api/employee/requests (after requireEmployeeSession).
 */
export const employeeRequestsRouter = Router();

const wrap = (fn: (req: import("express").Request, res: import("express").Response) => Promise<unknown>) => async (req: import("express").Request, res: import("express").Response) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof RequestError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
};
const me = (req: import("express").Request) => ({ tenantId: req.session!.tenantId!, employeeId: req.session!.employeeId! });

employeeRequestsRouter.get("/leave-balance", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await getLeaveBalance(tenantId, employeeId, Number(req.query.year) || new Date().getFullYear()));
});

employeeRequestsRouter.get("/overtime", requirePermission("attendance", "view"), async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(overtimeRequests).where(and(eq(overtimeRequests.tenantId, tenantId), eq(overtimeRequests.employeeId, employeeId))));
});
employeeRequestsRouter.post("/overtime", requirePermission("attendance", "create"), validateBody(overtimeInputSchema), wrap(async (req, res) => {
  const { tenantId, employeeId } = me(req);
  // An employee files their own request; "Perintah Atasan" (ordered by a superior) is an admin-side type.
  res.status(201).json(await submitOvertimeRequest({ tenantId, employeeId, input: { ...req.body, type: "Pengajuan Karyawan" }, actorUserId: null }));
}));

employeeRequestsRouter.get("/corrections", requirePermission("attendance", "view"), async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(attendanceCorrectionRequests).where(and(eq(attendanceCorrectionRequests.tenantId, tenantId), eq(attendanceCorrectionRequests.employeeId, employeeId))));
});
employeeRequestsRouter.post("/corrections", requirePermission("attendance", "create"), validateBody(correctionInputSchema), wrap(async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.status(201).json(await submitAttendanceCorrection({ tenantId, employeeId, input: req.body, actorUserId: null }));
}));

employeeRequestsRouter.get("/shift-swaps", requirePermission("attendance", "view"), async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(shiftSwapRequests).where(and(eq(shiftSwapRequests.tenantId, tenantId), or(eq(shiftSwapRequests.requesterId, employeeId), eq(shiftSwapRequests.targetEmployeeId, employeeId)))));
});
employeeRequestsRouter.post("/shift-swaps", requirePermission("attendance", "create"), validateBody(swapInputSchema), wrap(async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.status(201).json(await submitShiftSwapRequest({ tenantId, requesterId: employeeId, input: req.body, actorUserId: null }));
}));

employeeRequestsRouter.get("/loans", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(employeeLoans).where(and(eq(employeeLoans.tenantId, tenantId), eq(employeeLoans.employeeId, employeeId))));
});
employeeRequestsRouter.post("/loans", validateBody(loanInputSchema), wrap(async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.status(201).json(await submitLoanRequest({ tenantId, employeeId, input: req.body, actorUserId: null }));
}));

employeeRequestsRouter.get("/trips", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(businessTrips).where(and(eq(businessTrips.tenantId, tenantId), eq(businessTrips.employeeId, employeeId))));
});
employeeRequestsRouter.post("/trips", validateBody(tripInputSchema), wrap(async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.status(201).json(await submitBusinessTrip({ tenantId, employeeId, input: req.body, actorUserId: null }));
}));

employeeRequestsRouter.get("/leave", requirePermission("attendance", "view"), async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(leaveRequests).where(and(eq(leaveRequests.tenantId, tenantId), eq(leaveRequests.employeeId, employeeId))));
});
void z;

// ============================ Documents, team, delegation (employee portal parity with the retired ESS/MSS screens) ============================

/** Official documents issued to ME and fully signed (status "Resmi Diterbitkan") — never drafts or other people's. */
employeeRequestsRouter.get("/my-documents", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(officialDocuments).where(and(eq(officialDocuments.tenantId, tenantId), eq(officialDocuments.targetEmployeeId, employeeId), eq(officialDocuments.status, "Resmi Diterbitkan"))));
});

/** Peers under the same manager — the pool a shift swap can be requested with. Names only, nothing sensitive. */
employeeRequestsRouter.get("/colleagues", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  const [self] = await db.select({ managerId: employees.managerId }).from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!self?.managerId) return res.json([]);
  const peers = await db.select({ id: employees.id, fullName: employees.fullName }).from(employees).where(and(eq(employees.tenantId, tenantId), eq(employees.managerId, self.managerId), eq(employees.status, "Aktif"), ne(employees.id, employeeId)));
  res.json(peers);
});

/** A manager's direct reports with today's attendance and approved leave in the next 30 days (the old MSS "monitoring" + "cuti tim"). */
employeeRequestsRouter.get("/team", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  const reports = await db.select({ id: employees.id, fullName: employees.fullName, details: employees.details }).from(employees).where(and(eq(employees.tenantId, tenantId), eq(employees.managerId, employeeId), eq(employees.status, "Aktif")));
  if (reports.length === 0) return res.json([]);
  const ids = reports.map((r) => r.id);
  const today = nowWib().date;
  const horizon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [att, leaves] = await Promise.all([
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, tenantId), inArray(attendanceRecords.employeeId, ids), eq(attendanceRecords.date, today))),
    db.select().from(leaveRequests).where(and(eq(leaveRequests.tenantId, tenantId), inArray(leaveRequests.employeeId, ids), eq(leaveRequests.status, "Disetujui"), gte(leaveRequests.endDate, today), lte(leaveRequests.startDate, horizon))),
  ]);
  res.json(
    reports.map((r) => {
      const a = att.find((x) => x.employeeId === r.id);
      const d = r.details as Record<string, unknown>;
      return {
        id: r.id,
        fullName: r.fullName,
        position: typeof d.position === "string" ? d.position : null,
        today: a ? { clockIn: a.clockIn, clockOut: a.clockOut, status: a.status, lateMinutes: a.lateMinutes } : null,
        upcomingLeave: leaves.filter((l) => l.employeeId === r.id).map((l) => ({ leaveType: l.leaveType, startDate: l.startDate, endDate: l.endDate, totalDays: l.totalDays })),
      };
    })
  );
});

/** Approver delegation set by the approver themself (principal = me): while active, the substitute can decide in my place (the engine already honours this). */
employeeRequestsRouter.get("/delegations", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  res.json(await db.select().from(approvalDelegations).where(and(eq(approvalDelegations.tenantId, tenantId), eq(approvalDelegations.principalId, employeeId))));
});
employeeRequestsRouter.post(
  "/delegations",
  validateBody(z.object({ substituteId: z.string().uuid(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().trim().max(500).optional() })),
  async (req, res) => {
    const { tenantId, employeeId } = me(req);
    const b = req.body as { substituteId: string; startDate: string; endDate: string; reason?: string };
    if (b.endDate < b.startDate) return res.status(400).json({ error: "Tanggal selesai tidak boleh sebelum tanggal mulai." });
    if (b.substituteId === employeeId) return res.status(400).json({ error: "Pengganti tidak boleh diri sendiri." });
    const [sub] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, b.substituteId), eq(employees.tenantId, tenantId), eq(employees.status, "Aktif"))).limit(1);
    if (!sub) return res.status(400).json({ error: "Karyawan pengganti tidak ditemukan." });
    const [created] = await db
      .insert(approvalDelegations)
      .values({ tenantId, principalId: employeeId, substituteId: b.substituteId, startDate: new Date(`${b.startDate}T00:00:00+07:00`), endDate: new Date(`${b.endDate}T23:59:59+07:00`), reason: b.reason ?? null, isActive: true })
      .returning();
    res.status(201).json(created);
  }
);
employeeRequestsRouter.delete("/delegations/:id", async (req, res) => {
  const { tenantId, employeeId } = me(req);
  const [row] = await db.update(approvalDelegations).set({ isActive: false }).where(and(eq(approvalDelegations.id, String(req.params.id)), eq(approvalDelegations.tenantId, tenantId), eq(approvalDelegations.principalId, employeeId))).returning();
  if (!row) return res.status(404).json({ error: "Delegasi tidak ditemukan" });
  res.json({ ok: true });
});
