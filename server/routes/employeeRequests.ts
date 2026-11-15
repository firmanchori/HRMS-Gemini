import { Router } from "express";
import { z } from "zod";
import { and, eq, or } from "drizzle-orm";
import { db } from "../db/client.ts";
import { leaveRequests, overtimeRequests, employeeLoans, attendanceCorrectionRequests, shiftSwapRequests, businessTrips } from "../db/schema.ts";
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
