import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employeeSchedules, workShifts } from "../db/schema.ts";
import { timeToMinutes } from "./dates.ts";

/**
 * Lateness and overtime are facts the SERVER derives from the employee's rostered shift and the recorded clock times — never numbers a
 * browser supplies. The shift for a date is the employee's schedule entry; when none exists the tenant's "SH-NOR" shift is used, and
 * only if that doesn't exist either, DEFAULT_SHIFT (documented here, in one place).
 */
export interface ShiftRule {
  startTime: string;
  endTime: string;
  lateToleranceMins: number;
  isOff: boolean;
  source: "schedule" | "default-shift" | "builtin";
}

export const DEFAULT_SHIFT = { startTime: "08:00", endTime: "17:00", lateToleranceMins: 15 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveShift(tenantId: string, employeeId: string, date: string): Promise<ShiftRule> {
  const [entry] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, tenantId), eq(employeeSchedules.employeeId, employeeId), eq(employeeSchedules.date, date))).limit(1);
  if (entry) {
    if (entry.shiftId === "OFF") return { ...DEFAULT_SHIFT, isOff: true, source: "schedule" };
    if (UUID.test(entry.shiftId)) {
      const [shift] = await db.select().from(workShifts).where(and(eq(workShifts.id, entry.shiftId), eq(workShifts.tenantId, tenantId))).limit(1);
      if (shift) return { startTime: shift.startTime, endTime: shift.endTime, lateToleranceMins: shift.lateToleranceMins, isOff: false, source: "schedule" };
    }
  }
  const [normal] = await db.select().from(workShifts).where(and(eq(workShifts.tenantId, tenantId), eq(workShifts.code, "SH-NOR"), eq(workShifts.isActive, true))).limit(1);
  if (normal) return { startTime: normal.startTime, endTime: normal.endTime, lateToleranceMins: normal.lateToleranceMins, isOff: false, source: "default-shift" };
  return { ...DEFAULT_SHIFT, isOff: false, source: "builtin" };
}

/** Minutes late: measured from the shift start, and counted only once the tolerance is exceeded (e.g. 08:20 with tolerance 15 = 20 minutes late; 08:10 = on time). */
export function lateMinutes(shift: ShiftRule, clockIn: string): number {
  const diff = timeToMinutes(clockIn) - timeToMinutes(shift.startTime);
  return diff > shift.lateToleranceMins ? diff : 0;
}

/** Whole hours worked beyond the shift end. Handles night shifts that cross midnight. */
export function overtimeHours(shift: ShiftRule, clockOut: string, clockIn?: string | null): number {
  const start = timeToMinutes(shift.startTime);
  let end = timeToMinutes(shift.endTime);
  if (end <= start) end += 1440;
  let out = timeToMinutes(clockOut);
  if (out < start && (clockIn ? timeToMinutes(clockIn) >= start || end > 1440 : end > 1440)) out += 1440;
  return Math.max(0, Math.floor((out - end) / 60));
}

export async function deriveAttendanceFacts(tenantId: string, employeeId: string, date: string, clockIn?: string | null, clockOut?: string | null) {
  const shift = await resolveShift(tenantId, employeeId, date);
  const late = clockIn ? lateMinutes(shift, clockIn) : 0;
  const overtime = clockOut ? overtimeHours(shift, clockOut, clockIn) : 0;
  return { shift, lateMinutes: late, overtimeHours: overtime, status: clockIn ? (late > 0 ? "Terlambat" : "Hadir") : undefined };
}
