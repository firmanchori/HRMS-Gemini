import { Router } from "express";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employees, leaveRequests, overtimeRequests, employeeLoans, attendanceCorrectionRequests, shiftSwapRequests, businessTrips } from "../db/schema.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { logAudit } from "../lib/audit.ts";
import { getLeaveBalance } from "../lib/leaveBalance.ts";
import { RequestError, leaveInputSchema, overtimeInputSchema, loanInputSchema, correctionInputSchema, swapInputSchema, tripInputSchema, submitLeaveRequest, submitOvertimeRequest, submitLoanRequest, submitAttendanceCorrection, submitShiftSwapRequest, submitBusinessTrip } from "../lib/requests.ts";

/**
 * Admin-side routes for employee requests, on behalf of an employee within the admin's visibility. The admin can create a request and
 * read them; deciding is only ever done through the Approval Engine (/approval-items/:id/decision) — there is no status field and no
 * edit route for these tables.
 */
export function buildTenantRequestsRouter(resolveVisibleEmployeeIds: (req: import("express").Request, tenantId: string) => Promise<string[]>) {
  const router = Router();

  const visible = async (req: import("express").Request, employeeId: string) => (await resolveVisibleEmployeeIds(req, req.session!.tenantId!)).includes(employeeId);
  const wrap = (fn: (req: import("express").Request, res: import("express").Response) => Promise<unknown>) => async (req: import("express").Request, res: import("express").Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof RequestError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  };
  const list = (table: typeof leaveRequests | typeof overtimeRequests | typeof employeeLoans | typeof attendanceCorrectionRequests | typeof businessTrips) =>
    async (req: import("express").Request, res: import("express").Response) => {
      const tenantId = req.session!.tenantId!;
      const ids = await resolveVisibleEmployeeIds(req, tenantId);
      if (ids.length === 0) return res.json([]);
      res.json(await db.select().from(table).where(and(eq(table.tenantId, tenantId), inArray(table.employeeId, ids))));
    };

  router.get("/leave-requests", list(leaveRequests));
  router.get("/overtime-requests", list(overtimeRequests));
  router.get("/loans", list(employeeLoans));
  router.get("/attendance-corrections", list(attendanceCorrectionRequests));
  router.get("/business-trips", list(businessTrips));
  router.get("/shift-swap-requests", async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const ids = await resolveVisibleEmployeeIds(req, tenantId);
    if (ids.length === 0) return res.json([]);
    res.json(await db.select().from(shiftSwapRequests).where(and(eq(shiftSwapRequests.tenantId, tenantId), inArray(shiftSwapRequests.requesterId, ids))));
  });

  const forbidden = (res: import("express").Response) => res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const withEmployee = <T extends z.ZodTypeAny>(schema: T) => (schema as unknown as z.ZodObject<z.ZodRawShape>).extend({ employeeId: z.string().uuid() });

  router.post("/leave-requests", validateBody(leaveInputSchema.extend({ employeeId: z.string().uuid() })), wrap(async (req, res) => {
    const { employeeId, ...input } = req.body;
    if (!(await visible(req, employeeId))) return forbidden(res);
    res.status(201).json(await submitLeaveRequest({ tenantId: req.session!.tenantId!, employeeId, input, actorUserId: req.session!.userId }));
  }));
  router.post("/overtime-requests", validateBody(withEmployee(overtimeInputSchema)), wrap(async (req, res) => {
    const { employeeId, ...input } = req.body;
    if (!(await visible(req, employeeId))) return forbidden(res);
    res.status(201).json(await submitOvertimeRequest({ tenantId: req.session!.tenantId!, employeeId, input, actorUserId: req.session!.userId }));
  }));
  router.post("/loans", validateBody(loanInputSchema.extend({ employeeId: z.string().uuid() })), wrap(async (req, res) => {
    const { employeeId, ...input } = req.body;
    if (!(await visible(req, employeeId))) return forbidden(res);
    res.status(201).json(await submitLoanRequest({ tenantId: req.session!.tenantId!, employeeId, input, actorUserId: req.session!.userId }));
  }));
  router.post("/attendance-corrections", validateBody(withEmployee(correctionInputSchema)), wrap(async (req, res) => {
    const { employeeId, ...input } = req.body;
    if (!(await visible(req, employeeId))) return forbidden(res);
    res.status(201).json(await submitAttendanceCorrection({ tenantId: req.session!.tenantId!, employeeId, input, actorUserId: req.session!.userId }));
  }));
  router.post("/shift-swap-requests", validateBody(swapInputSchema.extend({ requesterId: z.string().uuid() })), wrap(async (req, res) => {
    const { requesterId, ...input } = req.body;
    if (!(await visible(req, requesterId))) return forbidden(res);
    res.status(201).json(await submitShiftSwapRequest({ tenantId: req.session!.tenantId!, requesterId, input, actorUserId: req.session!.userId }));
  }));
  router.post("/business-trips", validateBody(withEmployee(tripInputSchema)), wrap(async (req, res) => {
    const { employeeId, ...input } = req.body;
    if (!(await visible(req, employeeId))) return forbidden(res);
    res.status(201).json(await submitBusinessTrip({ tenantId: req.session!.tenantId!, employeeId, input, actorUserId: req.session!.userId }));
  }));

  /** Trips are the one request that has a post-approval step: the traveller's expense settlement closes an approved trip. */
  router.post("/business-trips/:id/complete", validateParams(uuidParam("id")), wrap(async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const [trip] = await db.select().from(businessTrips).where(and(eq(businessTrips.id, req.params.id), eq(businessTrips.tenantId, tenantId))).limit(1);
    if (!trip || !(await visible(req, trip.employeeId))) return res.status(404).json({ error: "Data perjalanan dinas tidak ditemukan" });
    if (trip.status !== "Disetujui Finance") return res.status(409).json({ error: "Hanya perjalanan yang sudah disetujui yang dapat diselesaikan." });
    const [updated] = await db.update(businessTrips).set({ status: "Selesai" }).where(eq(businessTrips.id, trip.id)).returning();
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: "business_trip.completed", details: { tripId: trip.id } });
    res.json(updated);
  }));

  // Leave balances (ledger-derived) for the employees in scope.
  router.get("/leave-balances", async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const year = Number(req.query.year) || new Date().getFullYear();
    const ids = await resolveVisibleEmployeeIds(req, tenantId);
    const active = ids.length ? await db.select({ id: employees.id }).from(employees).where(and(eq(employees.tenantId, tenantId), eq(employees.status, "Aktif"), inArray(employees.id, ids))) : [];
    res.json(await Promise.all(active.map((e) => getLeaveBalance(tenantId, e.id, year))));
  });

  return router;
}
