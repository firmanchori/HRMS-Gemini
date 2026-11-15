import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { leaveBalances, leaveLedger, leaveRequests, tenantModuleSettings, employees } from "../db/schema.ts";

/** Statutory minimum annual leave (UU 13/2003 Pasal 79: 12 working days after 12 months). Overridable per tenant in module settings "leave". */
export const DEFAULT_ANNUAL_LEAVE_DAYS = 12;

export async function getAnnualEntitlement(tenantId: string): Promise<number> {
  const [row] = await db.select().from(tenantModuleSettings).where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, "leave"))).limit(1);
  const v = Number((row?.settings as Record<string, unknown> | undefined)?.annualEntitlementDays);
  return Number.isInteger(v) && v >= 0 && v <= 365 ? v : DEFAULT_ANNUAL_LEAVE_DAYS;
}

async function ensureBalance(tenantId: string, employeeId: string, year: number) {
  const entitlement = await getAnnualEntitlement(tenantId);
  await db.insert(leaveBalances).values({ tenantId, employeeId, year, entitlement }).onConflictDoNothing();
  const [row] = await db.select().from(leaveBalances).where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year))).limit(1);
  return row;
}

export interface LeaveBalanceView {
  employeeId: string;
  year: number;
  entitlement: number;
  carried: number;
  used: number;
  /** Days of "Cuti Tahunan" requests still waiting for approval — reserved so two pending requests can't together exceed the balance. */
  pending: number;
  remaining: number;
  available: number;
}

export async function getLeaveBalance(tenantId: string, employeeId: string, year: number): Promise<LeaveBalanceView> {
  const bal = await ensureBalance(tenantId, employeeId, year);
  const rows = await db
    .select({ kind: leaveLedger.kind, total: sql<number>`coalesce(sum(${leaveLedger.days}), 0)::int` })
    .from(leaveLedger)
    .where(and(eq(leaveLedger.employeeId, employeeId), eq(leaveLedger.year, year)))
    .groupBy(leaveLedger.kind);
  const sum = (k: string) => rows.find((r) => r.kind === k)?.total ?? 0;
  const used = sum("deduct") - sum("restore");
  const [pendingRow] = await db
    .select({ total: sql<number>`coalesce(sum(${leaveRequests.totalDays}), 0)::int` })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.employeeId, employeeId), eq(leaveRequests.leaveType, "Cuti Tahunan"), eq(leaveRequests.status, "Menunggu"), sql`${leaveRequests.startDate} LIKE ${`${year}-%`}`));
  const remaining = bal.entitlement + bal.carried + sum("grant") - used;
  return { employeeId, year, entitlement: bal.entitlement, carried: bal.carried, used, pending: pendingRow.total, remaining, available: remaining - pendingRow.total };
}

/** Idempotent per (employee, source, kind): applying the same source twice changes nothing. Returns true when a new entry was written. */
export async function postLedger(params: { tenantId: string; employeeId: string; year: number; kind: "deduct" | "restore" | "grant"; days: number; sourceType: "leave_request" | "calendar_event" | "manual"; sourceId: string; note?: string }): Promise<boolean> {
  await ensureBalance(params.tenantId, params.employeeId, params.year);
  const inserted = await db
    .insert(leaveLedger)
    .values({ tenantId: params.tenantId, employeeId: params.employeeId, year: params.year, kind: params.kind, days: params.days, sourceType: params.sourceType, sourceId: params.sourceId, note: params.note ?? null })
    .onConflictDoNothing()
    .returning({ id: leaveLedger.id });
  return inserted.length > 0;
}

/**
 * A company-wide "cuti bersama" that draws on the annual leave bucket is written to every affected employee's ledger when the event is
 * created (one day each, idempotent per event) — it is no longer a display-only number recomputed on each render, so changing the
 * calendar later cannot silently rewrite history.
 */
export async function applyCollectiveLeave(event: { id: string; tenantId: string; entityId: string | null; date: string; type: string; deductsLeaveBucket: boolean | null; title: string }): Promise<number> {
  if (!event.deductsLeaveBucket || !event.type.startsWith("Cuti Bersama")) return 0;
  const where = event.entityId
    ? and(eq(employees.tenantId, event.tenantId), eq(employees.status, "Aktif"), eq(employees.entityId, event.entityId))
    : and(eq(employees.tenantId, event.tenantId), eq(employees.status, "Aktif"));
  const targets = await db.select({ id: employees.id }).from(employees).where(where);
  let posted = 0;
  for (const t of targets) {
    if (await postLedger({ tenantId: event.tenantId, employeeId: t.id, year: Number(event.date.slice(0, 4)), kind: "deduct", days: 1, sourceType: "calendar_event", sourceId: event.id, note: `Cuti bersama: ${event.title}` })) posted += 1;
  }
  return posted;
}
