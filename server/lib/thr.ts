import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employees, thrPayments } from "../db/schema.ts";
import { calculatePPh21TER } from "../../src/utils/taxCalculator.ts";
import type { PTKPStatus } from "../../src/types/hrms.ts";
import { logAudit } from "./audit.ts";

const VALID_PTKP = new Set(["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3", "K/I/0", "K/I/1", "K/I/2", "K/I/3"]);

export class ThrError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Whole months of service as of the payment date (a month counts only once the day-of-month is reached). */
export function tenureMonthsAt(joinDate: Date | null, paymentDate: string): number {
  if (!joinDate) return 0;
  const pay = new Date(`${paymentDate}T00:00:00Z`);
  let months = (pay.getUTCFullYear() - joinDate.getUTCFullYear()) * 12 + (pay.getUTCMonth() - joinDate.getUTCMonth());
  if (pay.getUTCDate() < joinDate.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

/** Permenaker 6/2016: ≥12 months → 1× wage; 1–11 months → pro-rata (months/12); <1 month → none. */
export function thrGross(baseWage: number, tenureMonths: number): number {
  if (tenureMonths >= 12) return baseWage;
  if (tenureMonths >= 1) return Math.round((tenureMonths / 12) * baseWage);
  return 0;
}

export async function generateThrRun(params: { tenantId: string; year: number; occasion: string; paymentDate: string; visibleEmployeeIds: string[]; actorUserId: string | null }) {
  const { tenantId, year } = params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.paymentDate) || Number(params.paymentDate.slice(0, 4)) !== year) throw new ThrError("Tanggal pembayaran harus berada di tahun THR yang dipilih.");
  const emps = params.visibleEmployeeIds.length
    ? await db.select().from(employees).where(and(eq(employees.tenantId, tenantId), eq(employees.status, "Aktif"), inArray(employees.id, params.visibleEmployeeIds)))
    : [];
  if (emps.length === 0) throw new ThrError("Tidak ada karyawan aktif dalam cakupan Anda.");
  const existing = await db.select().from(thrPayments).where(and(eq(thrPayments.tenantId, tenantId), eq(thrPayments.year, year)));
  const byEmp = new Map(existing.map((r) => [r.employeeId, r]));
  let skippedPaid = 0;
  const out = [];
  for (const emp of emps) {
    const prev = byEmp.get(emp.id);
    if (prev?.status === "Paid") {
      skippedPaid += 1;
      out.push(prev);
      continue;
    }
    const det = emp.details as Record<string, unknown>;
    const ptkpRaw = typeof det.ptkp === "string" ? det.ptkp : "TK/0";
    const ptkp = (VALID_PTKP.has(ptkpRaw) ? ptkpRaw : "TK/0") as PTKPStatus;
    const tenure = tenureMonthsAt(emp.joinDate, params.paymentDate);
    const gross = thrGross(emp.basicSalary, tenure);
    const tax = calculatePPh21TER(gross, ptkp);
    const row = {
      occasion: params.occasion,
      paymentDate: params.paymentDate,
      tenureMonths: tenure,
      baseWage: emp.basicSalary,
      grossAmount: gross,
      terCategory: tax.category,
      terRatePercent: tax.ratePercent,
      taxAmount: gross > 0 ? tax.taxAmount : 0,
      netAmount: Math.max(0, gross - (gross > 0 ? tax.taxAmount : 0)),
    };
    if (prev) out.push((await db.update(thrPayments).set(row).where(eq(thrPayments.id, prev.id)).returning())[0]);
    else out.push((await db.insert(thrPayments).values({ ...row, tenantId, employeeId: emp.id, year, status: "Draft" }).returning())[0]);
  }
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "thr.generated", details: { year, occasion: params.occasion, employees: out.length, skippedPaid } });
  return out;
}

/** Marks calculated THR rows as paid (all unpaid rows with an amount for the year, or just the given employees). Paid rows never change again. */
export async function payThr(params: { tenantId: string; year: number; employeeIds?: string[]; actorUserId: string | null }) {
  const { tenantId, year } = params;
  const rows = await db.select().from(thrPayments).where(and(eq(thrPayments.tenantId, tenantId), eq(thrPayments.year, year)));
  const targets = rows.filter((r) => r.status === "Draft" && r.grossAmount > 0 && (!params.employeeIds || params.employeeIds.includes(r.employeeId)));
  if (targets.length === 0) throw new ThrError("Tidak ada THR yang menunggu pembayaran. Hitung THR terlebih dahulu.", 409);
  await db.update(thrPayments).set({ status: "Paid", paidAt: new Date() }).where(inArray(thrPayments.id, targets.map((t) => t.id)));
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "thr.paid", details: { year, count: targets.length, totalNet: targets.reduce((s, t) => s + t.netAmount, 0) } });
  return targets.length;
}

export async function listThrPayments(tenantId: string, year?: number) {
  const where = year ? and(eq(thrPayments.tenantId, tenantId), eq(thrPayments.year, year)) : eq(thrPayments.tenantId, tenantId);
  return db.select().from(thrPayments).where(where);
}
