import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createApp } from "../app.ts";
import { withCsrf } from "../lib/testCsrf.ts";
import { db, pool } from "../db/client.ts";
import { calculateOvertimePay, calculatePPh21TER, calculateBPJS } from "../../src/utils/taxCalculator.ts";
import { tenants, tenantSubscriptions, users, subscriptionPlans, companyEntities, entityClosure, employees, sessions, auditLogEntries, payrollRecords, payrollPeriods, reimbursementClaims, approvalItems, employeeLoans, overtimeRequests, attendanceRecords } from "../db/schema.ts";

/**
 * Payroll is computed on the server from database facts. A client can only
 * ask for a run by period, approve it, and disburse it — it can never send
 * a number, and an approved/disbursed period is locked.
 */
const app = createApp();
const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
const SUBDOMAIN = "payroll-tenant";
const origin = `http://${SUBDOMAIN}.${baseDomain}`;
const PASSWORD = "ChangeMe123!";

let tenantId: string;
let entityId: string;
let empA: string;
let empB: string;
let loanId: string;
let claimId: string;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false)).limit(1);
  const [tenant] = await db.insert(tenants).values({ name: "Payroll Test", subdomain: SUBDOMAIN, planId: plan?.id, status: "Active" }).returning();
  tenantId = tenant.id;
  await db.insert(tenantSubscriptions).values({ tenantId, planId: plan!.id, status: "Active", startedAt: new Date() });
  await db.insert(users).values({ tenantId, role: "tenant_admin", name: "Payroll Admin", email: "admin@payroll.local", passwordHash: await bcrypt.hash(PASSWORD, 10) });
  const [entity] = await db.insert(companyEntities).values({ tenantId, name: "Payroll Co", code: "PAYTEST" }).returning();
  entityId = entity.id;
  await db.insert(entityClosure).values({ ancestorEntityId: entityId, descendantEntityId: entityId, depth: 0 });
  const [a] = await db.insert(employees).values({ tenantId, entityId, nik: "PAY-A", fullName: "Karyawan A", basicSalary: 10_000_000, details: { ptkp: "K/1", fixedAllowance: 500_000, positionAllowance: 1_000_000 } }).returning();
  const [b] = await db.insert(employees).values({ tenantId, entityId, nik: "PAY-B", fullName: "Karyawan B", basicSalary: 5_000_000, details: { ptkp: "TK/0" } }).returning();
  empA = a.id;
  empB = b.id;
  await db.insert(attendanceRecords).values({ tenantId, employeeId: empA, date: "2026-10-05", lateMinutes: 130 });
  await db.insert(overtimeRequests).values({ tenantId, employeeId: empA, date: "2026-10-10", startTime: "18:00", endTime: "21:00", hours: 3, status: "Disetujui", approvedHours: 3, compensationType: "Lembur Berbayar" });
  await db.insert(overtimeRequests).values({ tenantId, employeeId: empA, date: "2026-10-11", startTime: "18:00", endTime: "22:00", hours: 4, status: "Disetujui", approvedHours: 4, compensationType: "Cuti Pengganti" });
  const [loan] = await db.insert(employeeLoans).values({ tenantId, employeeId: empA, loanType: "Kasbon", totalAmount: 2_000_000, tenorMonths: 4, monthlyInstallment: 500_000, remainingAmount: 1_500_000, startDate: "2026-08-01", status: "Aktif" }).returning();
  loanId = loan.id;

  agent = withCsrf(request.agent(app));
  const login = await agent.post("/api/auth/login").set("Origin", origin).send({ email: "admin@payroll.local", password: PASSWORD });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  await db.delete(payrollRecords).where(eq(payrollRecords.tenantId, tenantId));
  await db.delete(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
  await db.delete(reimbursementClaims).where(eq(reimbursementClaims.tenantId, tenantId));
  await db.delete(approvalItems).where(eq(approvalItems.tenantId, tenantId));
  await db.delete(employeeLoans).where(eq(employeeLoans.tenantId, tenantId));
  await db.delete(overtimeRequests).where(eq(overtimeRequests.tenantId, tenantId));
  await db.delete(attendanceRecords).where(eq(attendanceRecords.tenantId, tenantId));
  await db.delete(employees).where(eq(employees.tenantId, tenantId));
  await db.delete(entityClosure).where(eq(entityClosure.ancestorEntityId, entityId));
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId));
  await db.delete(auditLogEntries).where(eq(auditLogEntries.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await pool.end();
});

describe("server-side payroll", () => {
  it("reimbursement: born pending, approved only through the engine, then counted by payroll", async () => {
    const created = await agent.post("/api/tenant/reimbursement-claims").set("Origin", origin).send({ employeeId: empA, category: "Transportasi", amount: 250_000, description: "Taksi ke klien", receiptDate: "2026-10-12", status: "Disetujui", approvedAmount: 999 });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("Menunggu Review");
    expect(created.body.approvedAmount).toBeNull();
    claimId = created.body.id;
    const decide = await agent.post(`/api/tenant/approval-items/${created.body.approvalItemId}/decision`).set("Origin", origin).send({ decision: "Disetujui" });
    expect(decide.status).toBe(200);
    const [claim] = await db.select().from(reimbursementClaims).where(eq(reimbursementClaims.id, claimId));
    expect(claim.status).toBe("Disetujui");
    expect(claim.approvedAmount).toBe(250_000);
  });

  it("a run computes every figure from the database; client-sent figures and old write routes do not exist", async () => {
    const run = await agent.post("/api/tenant/payroll-runs").set("Origin", origin).send({ periodKey: "2026-10", netPay: 99_999_999, pph21Amount: 0 });
    expect(run.status).toBe(201);
    expect(run.body.records).toHaveLength(2);
    const a = run.body.records.find((r: { employeeId: string }) => r.employeeId === empA);

    expect(a.period).toBe("Oktober 2026");
    expect(a.overtimePay).toBe(calculateOvertimePay(10_000_000, 3)); // the 4h "Cuti Pengganti" is not paid
    expect(a.lateDeduction).toBe(100_000); // floor(130/60)=2h × 50.000
    expect(a.reimbursement).toBe(250_000);
    expect(a.loanDeduction).toBe(500_000);
    expect(a.allowances).toBe(1_500_000);
    const bpjs = calculateBPJS(10_000_000 + 500_000);
    expect(a.bpjsKesEmployee).toBe(bpjs.bpjsKesEmployee);
    const taxable = 10_000_000 + 1_500_000 + a.overtimePay + bpjs.breakdown.jkkCompany + bpjs.breakdown.jkmCompany + bpjs.bpjsKesCompany;
    const tax = calculatePPh21TER(taxable, "K/1");
    expect(a.pph21TERCategory).toBe("TER B");
    expect(a.pph21Amount).toBe(tax.taxAmount);
    expect(a.grossPay).toBe(10_000_000 + 1_500_000 + a.overtimePay + 250_000);
    expect(a.totalDeductions).toBe(bpjs.bpjsKesEmployee + bpjs.bpjsTkEmployee + tax.taxAmount + 500_000 + 100_000);
    expect(a.netPay).toBe(a.grossPay - a.totalDeductions);

    // No endpoint accepts payroll figures from a client any more.
    const upsert = await agent.post("/api/tenant/payroll-records/upsert").set("Origin", origin).send({ employeeId: empA, period: "Oktober 2026", netPay: 1 });
    expect(upsert.status).toBe(404);
    const put = await agent.put(`/api/tenant/payroll-records/${a.id}`).set("Origin", origin).send({ netPay: 1 });
    expect(put.status).toBe(404);
  });

  it("re-running a Draft period replaces the records instead of duplicating them", async () => {
    const again = await agent.post("/api/tenant/payroll-runs").set("Origin", origin).send({ periodKey: "2026-10" });
    expect(again.status).toBe(201);
    const rows = await db.select().from(payrollRecords).where(eq(payrollRecords.tenantId, tenantId));
    expect(rows).toHaveLength(2);
  });

  it("disbursing before approval is refused; approving locks the period against regeneration", async () => {
    const early = await agent.post("/api/tenant/payroll-runs/2026-10/disburse").set("Origin", origin);
    expect(early.status).toBe(409);
    const missing = await agent.post("/api/tenant/payroll-runs/2026-09/approve").set("Origin", origin);
    expect(missing.status).toBe(404);

    expect((await agent.post("/api/tenant/payroll-runs/2026-10/approve").set("Origin", origin)).status).toBe(200);
    const regen = await agent.post("/api/tenant/payroll-runs").set("Origin", origin).send({ periodKey: "2026-10" });
    expect(regen.status).toBe(409);
  });

  it("disbursing pays once: loan installment deducted, claim stamped, period final", async () => {
    expect((await agent.post("/api/tenant/payroll-runs/2026-10/disburse").set("Origin", origin)).status).toBe(200);
    const [loan] = await db.select().from(employeeLoans).where(eq(employeeLoans.id, loanId));
    expect(loan.remainingAmount).toBe(1_000_000);
    const [claim] = await db.select().from(reimbursementClaims).where(eq(reimbursementClaims.id, claimId));
    expect(claim.processedPeriod).toBe("Oktober 2026");
    const rows = await db.select().from(payrollRecords).where(eq(payrollRecords.tenantId, tenantId));
    expect(rows.every((r) => r.status === "Disbursed" && r.paidDate)).toBe(true);

    const twice = await agent.post("/api/tenant/payroll-runs/2026-10/disburse").set("Origin", origin);
    expect(twice.status).toBe(409);
    const [loanAfter] = await db.select().from(employeeLoans).where(eq(employeeLoans.id, loanId));
    expect(loanAfter.remainingAmount).toBe(1_000_000); // not deducted twice
    const noOptIn = await agent.put(`/api/tenant/reimbursement-claims/${claimId}/payroll-opt-in`).set("Origin", origin).send({ processInPayroll: false });
    expect(noOptIn.status).toBe(409); // already paid
  });

  it("an invalid period key is rejected", async () => {
    const bad = await agent.post("/api/tenant/payroll-runs").set("Origin", origin).send({ periodKey: "Oktober 2026" });
    expect(bad.status).toBe(400);
  });
});
