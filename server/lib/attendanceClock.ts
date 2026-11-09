import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employees, officeLocations, tenantModuleSettings, attendanceRecords } from "../db/schema.ts";
import { isWithinAnyLocation, type GeofenceLocation } from "./geofence.ts";

/**
 * Core Clock-In/Out business logic (user, 2026-11-09 ESS redesign),
 * shared by two callers: server/routes/employee.ts (a real employee
 * acting on their OWN record via session.employeeId) and
 * server/routes/tenant.ts (a tenant_admin acting on an employee's behalf
 * via EssPortal.tsx's "view as employee" simulation, with an explicit
 * employeeId checked against that admin's visibility scope). Both must
 * enforce the exact same rules, so the rules live here once.
 */

export type WorkType = "WFO" | "WFA" | "Perjalanan Dinas";

export class ClockError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const DEFAULT_CLOCK_WINDOWS = { clockInWindowStart: "06:00", clockInWindowEnd: "10:00", clockOutWindowStart: "16:00", clockOutWindowEnd: "22:00" };

/** "jam mulai clock in dan batas clock-in" — a hard window: outside it, clock-in/out is refused outright, not just flagged late. Compares the server's local clock, same WIB assumption the rest of this app already makes (e.g. Header.tsx's "Hari ini, {time} WIB"). */
export function isWithinTimeWindow(start: string, end: string): boolean {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return nowMinutes >= startH * 60 + startM && nowMinutes <= endH * 60 + endM;
}

export async function getClockWindows(tenantId: string) {
  const [row] = await db.select().from(tenantModuleSettings).where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, "attendance"))).limit(1);
  const s = (row?.settings as Record<string, unknown>) || {};
  return {
    clockInWindowStart: (s.clockInWindowStart as string) || DEFAULT_CLOCK_WINDOWS.clockInWindowStart,
    clockInWindowEnd: (s.clockInWindowEnd as string) || DEFAULT_CLOCK_WINDOWS.clockInWindowEnd,
    clockOutWindowStart: (s.clockOutWindowStart as string) || DEFAULT_CLOCK_WINDOWS.clockOutWindowStart,
    clockOutWindowEnd: (s.clockOutWindowEnd as string) || DEFAULT_CLOCK_WINDOWS.clockOutWindowEnd,
    requireSelfieCameraDefault: (s.cameraSelfieRequired as boolean) ?? true,
  };
}

/** The employee's own assigned office locations (employees.details.officeLocationIds) — never every location in the tenant. */
export async function getAssignedLocations(tenantId: string, employeeId: string): Promise<GeofenceLocation[]> {
  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  const ids = ((employee?.details as Record<string, unknown>)?.officeLocationIds as string[] | undefined) || [];
  if (ids.length === 0) return [];
  return db.select().from(officeLocations).where(and(eq(officeLocations.tenantId, tenantId), inArray(officeLocations.id, ids)));
}

export function effectiveWorkTypeOptions(employee: typeof employees.$inferSelect): WorkType[] {
  const configured = (employee.details as Record<string, unknown>)?.allowedWorkTypes as WorkType[] | undefined;
  return configured && configured.length > 0 ? configured : ["WFO", "WFA", "Perjalanan Dinas"];
}

export interface ClockInCheckResult {
  insideRadius: boolean;
  hasAssignedLocations: boolean;
  allowedWorkTypes: WorkType[];
  requireSelfieCamera: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export async function checkClockIn(tenantId: string, employeeId: string, lat: number, lng: number): Promise<ClockInCheckResult> {
  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee) throw new ClockError("Data karyawan tidak ditemukan", 404);

  const locations = await getAssignedLocations(tenantId, employeeId);
  const insideRadius = isWithinAnyLocation(lat, lng, locations);
  const windows = await getClockWindows(tenantId);
  return {
    insideRadius,
    hasAssignedLocations: locations.length > 0,
    allowedWorkTypes: effectiveWorkTypeOptions(employee),
    requireSelfieCamera: ((employee.details as Record<string, unknown>)?.requireSelfieCamera as boolean | undefined) ?? windows.requireSelfieCameraDefault,
    withinTimeWindow: isWithinTimeWindow(windows.clockInWindowStart, windows.clockInWindowEnd),
    windowStart: windows.clockInWindowStart,
    windowEnd: windows.clockInWindowEnd,
  };
}

export interface ClockOutCheckResult {
  insideRadius: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export async function checkClockOut(tenantId: string, employeeId: string, lat: number, lng: number): Promise<ClockOutCheckResult> {
  const locations = await getAssignedLocations(tenantId, employeeId);
  const insideRadius = isWithinAnyLocation(lat, lng, locations);
  const windows = await getClockWindows(tenantId);
  return {
    insideRadius,
    withinTimeWindow: isWithinTimeWindow(windows.clockOutWindowStart, windows.clockOutWindowEnd),
    windowStart: windows.clockOutWindowStart,
    windowEnd: windows.clockOutWindowEnd,
  };
}

/** Everything the /check endpoint already showed the user is re-verified here, from scratch — the client's own report is never trusted for the actual commit. */
export async function performClockIn(tenantId: string, employeeId: string, lat: number, lng: number, workType: WorkType) {
  const windows = await getClockWindows(tenantId);
  if (!isWithinTimeWindow(windows.clockInWindowStart, windows.clockInWindowEnd)) {
    throw new ClockError(`Clock-in hanya bisa dilakukan antara pukul ${windows.clockInWindowStart} - ${windows.clockInWindowEnd}.`, 400);
  }

  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  if (!employee) throw new ClockError("Data karyawan tidak ditemukan", 404);
  if (!effectiveWorkTypeOptions(employee).includes(workType)) {
    throw new ClockError(`Opsi "${workType}" tidak diizinkan untuk akun ini.`, 403);
  }

  const locations = await getAssignedLocations(tenantId, employeeId);
  const insideRadius = isWithinAnyLocation(lat, lng, locations);
  if (workType === "WFO" && !insideRadius) {
    throw new ClockError("WFO hanya bisa clock-in di dalam radius/area lokasi kantor yang ditugaskan.", 400);
  }

  const date = new Date().toISOString().slice(0, 10);
  const fields = {
    clockIn: new Date().toTimeString().slice(0, 5),
    workType,
    clockInLat: lat,
    clockInLng: lng,
    clockInInsideRadius: insideRadius,
    status: "Hadir",
  };

  const [existing] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, tenantId), eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, date))).limit(1);
  if (existing) {
    const [updated] = await db.update(attendanceRecords).set(fields).where(eq(attendanceRecords.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(attendanceRecords).values({ ...fields, date, employeeId, tenantId }).returning();
  return created;
}

/** No workType on clock-out — "tanpa harus memerika apakah wfa, wfo ataupun perjalanan dinas" — only inside/outside status + lat/lng get recorded. */
export async function performClockOut(tenantId: string, employeeId: string, lat: number, lng: number) {
  const windows = await getClockWindows(tenantId);
  if (!isWithinTimeWindow(windows.clockOutWindowStart, windows.clockOutWindowEnd)) {
    throw new ClockError(`Clock-out hanya bisa dilakukan antara pukul ${windows.clockOutWindowStart} - ${windows.clockOutWindowEnd}.`, 400);
  }

  const date = new Date().toISOString().slice(0, 10);
  const [existing] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, tenantId), eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, date))).limit(1);
  if (!existing || !existing.clockIn) {
    throw new ClockError("Belum ada clock-in hari ini — clock-in terlebih dahulu.", 400);
  }

  const locations = await getAssignedLocations(tenantId, employeeId);
  const insideRadius = isWithinAnyLocation(lat, lng, locations);
  const [updated] = await db
    .update(attendanceRecords)
    .set({
      clockOut: new Date().toTimeString().slice(0, 5),
      clockOutLat: lat,
      clockOutLng: lng,
      clockOutInsideRadius: insideRadius,
    })
    .where(eq(attendanceRecords.id, existing.id))
    .returning();
  return updated;
}
