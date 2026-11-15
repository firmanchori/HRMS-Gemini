import { and, eq, inArray, isNull, like } from "drizzle-orm";
import { db } from "../db/client.ts";
import {
  payrollPeriods,
  payrollRecords,
  employees,
  attendanceRecords,
  overtimeRequests,
  reimbursementClaims,
  employeeSalaryComponentAssignments,
  salaryComponents,
  employeeLoans,
  tenantModuleSettings,
} from "../db/schema.ts";
import { calculatePPh21TER, calculateBPJS, calculateOvertimePay } from "../../src/utils/taxCalculator.ts";
import type { PTKPStatus } from "../../src/types/hrms.ts";
import { logAudit } from "./audit.ts";
import { todayWib } from "./dates.ts";

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DEFAULT_LATE_PENALTY_PER_HOUR = 50000;
const VALID_PTKP = new Set(["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3", "K/I/0", "K/I/1", "K/I/2", "K/I/3"]);

export class PayrollError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function isValidPeriodKey(key: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
}
/** "2026-10" -> "Oktober 2026" (the label the existing UI/records use as `period`). */
export function periodLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_ID[m - 1]} ${y}`;
}

/**
 * The payroll calculation, server-side. Inputs are read from the database
 * (employee master, approved overtime, late minutes, approved reimbursement
 * claims, salary component assignments, active loans) — the caller supplies
 * only the period and which employees are in its visibility scope, never a
 * number. Only a Draft period can be (re)generated.
 */
export async function generatePayrollRun(params: { tenantId: string; periodKey: string; visibleEmployeeIds: string[]; actorUserId: string | null }) {
  const { tenantId, periodKey } = params;
  if (!isValidPeriodKey(periodKey)) throw new PayrollError("Periode harus berformat YYYY-MM.");
  const label = periodLabel(periodKey);

  let [period] = await db.select().from(payrollPeriods).where(and(eq(payrollPeriods.tenantId, tenantId), eq(payrollPeriods.periodKey, periodKey))).limit(1);
  const existingRecords = await db.select().from(payrollRecords).where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.period, label)));
  if (!period) {
    // Legacy runs (created before periods existed) that were already approved/disbursed lock the period too.
    const legacyStatus = existingRecords.find((r) => r.status === "Disbursed") ? "Disbursed" : existingRecords.find((r) => r.status === "Approved") ? "Approved" : "Draft";
    [period] = await db.insert(payrollPeriods).values({ tenantId, periodKey, label, status: legacyStatus }).returning();
  }
  if (period.status !== "Draft") throw new PayrollError(`Payroll periode ${label} sudah ${period.status === "Approved" ? "disetujui" : "dibayarkan"} dan terkunci.`, 409);

  const emps = params.visibleEmployeeIds.length
    ? await db.select().from(employees).where(and(eq(employees.tenantId, tenantId), eq(employees.status, "Aktif"), inArray(employees.id, params.visibleEmployeeIds)))
    : [];
  if (emps.length === 0) throw new PayrollError("Tidak ada karyawan aktif dalam cakupan Anda untuk diproses.");
  const empIds = emps.map((e) => e.id);

  const [attendance, overtime, claims, assignments, components, loans, settingsRow] = await Promise.all([
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, tenantId), inArray(attendanceRecords.employeeId, empIds), like(attendanceRecords.date, `${periodKey}%`))),
    db.select().from(overtimeRequests).where(and(eq(overtimeRequests.tenantId, tenantId), inArray(overtimeRequests.employeeId, empIds), eq(overtimeRequests.status, "Disetujui"), eq(overtimeRequests.compensationType, "Lembur Berbayar"), like(overtimeRequests.date, `${periodKey}%`))),
    db.select().from(reimbursementClaims).where(and(eq(reimbursementClaims.tenantId, tenantId), inArray(reimbursementClaims.employeeId, empIds), eq(reimbursementClaims.status, "Disetujui"), eq(reimbursementClaims.processInPayroll, true))),
    db.select().from(employeeSalaryComponentAssignments).where(and(eq(employeeSalaryComponentAssignments.tenantId, tenantId), inArray(employeeSalaryComponentAssignments.employeeId, empIds), eq(employeeSalaryComponentAssignments.isActive, true))),
    db.select().from(salaryComponents).where(eq(salaryComponents.tenantId, tenantId)),
    db.select().from(employeeLoans).where(and(eq(employeeLoans.tenantId, tenantId), inArray(employeeLoans.employeeId, empIds), eq(employeeLoans.status, "Aktif"))),
    db.select().from(tenantModuleSettings).where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, "attendance"))).limit(1),
  ]);
  const penaltyPerHour = Number((settingsRow[0]?.settings as Record<string, unknown> | undefined)?.latePenaltyPerHour) || DEFAULT_LATE_PENALTY_PER_HOUR;
  const componentById = new Map(components.map((c) => [c.id, c]));
  const [yearNum, monthNum] = periodKey.split("-").map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const rows = emps.map((emp) => {
    const det = emp.details as Record<string, unknown>;
    const num = (k: string) => (typeof det[k] === "number" ? (det[k] as number) : 0);
    const ptkpRaw = typeof det.ptkp === "string" ? det.ptkp : "TK/0";
    const ptkp = (VALID_PTKP.has(ptkpRaw) ? ptkpRaw : "TK/0") as PTKPStatus;

    const lateMins = attendance.filter((a) => a.employeeId === emp.id).reduce((s, a) => s + (a.lateMinutes || 0), 0);
    const lateDeduction = Math.floor(lateMins / 60) * penaltyPerHour;

    const overtimeHours = overtime.filter((o) => o.employeeId === emp.id).reduce((s, o) => s + (o.approvedHours ?? o.hours ?? 0), 0);
    const overtimePay = calculateOvertimePay(emp.basicSalary, overtimeHours);

    const reimbursement = claims.filter((c) => c.employeeId === emp.id && (!c.processedPeriod || c.processedPeriod === label)).reduce((s, c) => s + (c.approvedAmount ?? c.amount), 0);

    let prorata = 1;
    if (emp.joinDate && emp.joinDate.toISOString().startsWith(periodKey)) {
      const joinDay = emp.joinDate.getUTCDate();
      prorata = Math.min(1, Math.max(1, daysInMonth - joinDay + 1) / daysInMonth);
    }
    const basicSalary = Math.round(emp.basicSalary * prorata);

    const custom = assignments
      .filter((a) => a.employeeId === emp.id)
      .reduce((sum, a) => {
        const comp = componentById.get(a.componentId);
        if (comp?.category === "Potongan") return sum;
        return sum + (a.amount || comp?.defaultValue || 0);
      }, 0);
    const allowances = num("fixedAllowance") + num("positionAllowance") + num("transportAllowance") + num("mealAllowance") + custom;

    const activeLoan = loans.find((l) => l.employeeId === emp.id);
    const loanDeduction = activeLoan ? Math.min(activeLoan.monthlyInstallment, activeLoan.remainingAmount) : 0;

    const bpjs = calculateBPJS(basicSalary + num("fixedAllowance"));
    const taxableGross = basicSalary + allowances + overtimePay + bpjs.breakdown.jkkCompany + bpjs.breakdown.jkmCompany + bpjs.bpjsKesCompany;
    const tax = calculatePPh21TER(taxableGross, ptkp);

    const grossPay = basicSalary + allowances + overtimePay + reimbursement;
    const totalDeductions = bpjs.bpjsKesEmployee + bpjs.bpjsTkEmployee + tax.taxAmount + loanDeduction + lateDeduction;
    return {
      employeeId: emp.id,
      period: label,
      basicSalary,
      allowances,
      overtimePay,
      reimbursement,
      thrBonus: 0,
      grossPay,
      bpjsKesCompany: bpjs.bpjsKesCompany,
      bpjsKesEmployee: bpjs.bpjsKesEmployee,
      bpjsTkCompany: bpjs.bpjsTkCompany,
      bpjsTkEmployee: bpjs.bpjsTkEmployee,
      pph21TERCategory: tax.category,
      pph21RatePercent: tax.ratePercent,
      pph21Amount: tax.taxAmount,
      loanDeduction,
      lateDeduction,
      totalDeductions,
      netPay: Math.max(0, grossPay - totalDeductions),
    };
  });

  const existingByEmp = new Map(existingRecords.map((r) => [r.employeeId, r]));
  const saved = await db.transaction(async (tx) => {
    const out = [];
    for (const row of rows) {
      const prev = existingByEmp.get(row.employeeId);
      if (prev) out.push((await tx.update(payrollRecords).set({ ...row, status: "Draft", paidDate: null }).where(eq(payrollRecords.id, prev.id)).returning())[0]);
      else out.push((await tx.insert(payrollRecords).values({ ...row, tenantId, status: "Draft" }).returning())[0]);
    }
    await tx.update(payrollPeriods).set({ generatedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
    return out;
  });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "payroll.generated", details: { periodKey, label, employees: saved.length } });
  return { period: { ...period, generatedAt: new Date() }, records: saved };
}

export async function approvePayrollPeriod(params: { tenantId: string; periodKey: string; approvedBy: string; actorUserId: string | null }) {
  const { tenantId, periodKey } = params;
  const [period] = await db.select().from(payrollPeriods).where(and(eq(payrollPeriods.tenantId, tenantId), eq(payrollPeriods.periodKey, periodKey))).limit(1);
  if (!period) throw new PayrollError("Periode payroll belum dibuat.", 404);
  if (period.status !== "Draft") throw new PayrollError(`Periode sudah ${period.status === "Approved" ? "disetujui" : "dibayarkan"}.`, 409);
  const records = await db.select().from(payrollRecords).where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.period, period.label)));
  if (records.length === 0) throw new PayrollError("Belum ada data payroll untuk disetujui. Jalankan payroll terlebih dahulu.");
  await db.transaction(async (tx) => {
    await tx.update(payrollRecords).set({ status: "Approved" }).where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.period, period.label)));
    await tx.update(payrollPeriods).set({ status: "Approved", approvedBy: params.approvedBy, approvedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
  });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "payroll.approved", details: { periodKey, label: period.label, records: records.length } });
}

/** Pays an approved period: marks records Disbursed, deducts each employee's loan installment exactly once, and stamps the reimbursement claims it paid. Atomic. */
export async function disbursePayrollPeriod(params: { tenantId: string; periodKey: string; actorUserId: string | null }) {
  const { tenantId, periodKey } = params;
  const [period] = await db.select().from(payrollPeriods).where(and(eq(payrollPeriods.tenantId, tenantId), eq(payrollPeriods.periodKey, periodKey))).limit(1);
  if (!period) throw new PayrollError("Periode payroll belum dibuat.", 404);
  if (period.status === "Disbursed") throw new PayrollError("Periode ini sudah dibayarkan.", 409);
  if (period.status !== "Approved") throw new PayrollError("Periode harus disetujui terlebih dahulu sebelum dibayarkan.", 409);
  const records = await db.select().from(payrollRecords).where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.period, period.label)));
  const today = todayWib();
  await db.transaction(async (tx) => {
    for (const r of records) {
      if (r.loanDeduction > 0) {
        const [loan] = await tx.select().from(employeeLoans).where(and(eq(employeeLoans.tenantId, tenantId), eq(employeeLoans.employeeId, r.employeeId), eq(employeeLoans.status, "Aktif"))).limit(1);
        if (loan) {
          const remaining = Math.max(0, loan.remainingAmount - r.loanDeduction);
          await tx.update(employeeLoans).set({ remainingAmount: remaining, status: remaining === 0 ? "Lunas" : "Aktif" }).where(eq(employeeLoans.id, loan.id));
        }
      }
      if (r.reimbursement > 0) {
        await tx
          .update(reimbursementClaims)
          .set({ processedPeriod: period.label })
          .where(and(eq(reimbursementClaims.tenantId, tenantId), eq(reimbursementClaims.employeeId, r.employeeId), eq(reimbursementClaims.status, "Disetujui"), eq(reimbursementClaims.processInPayroll, true), isNull(reimbursementClaims.processedPeriod)));
      }
    }
    await tx.update(payrollRecords).set({ status: "Disbursed", paidDate: today }).where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.period, period.label)));
    await tx.update(payrollPeriods).set({ status: "Disbursed", disbursedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
  });
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "payroll.disbursed", details: { periodKey, label: period.label, records: records.length } });
}

