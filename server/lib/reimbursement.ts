import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.ts";
import { reimbursementClaims, employees, approvalItems } from "../db/schema.ts";
import { buildApprovalSteps, currentBlockingStep, finalizeHooks } from "./approvalEngine.ts";
import { logAudit } from "./audit.ts";

export const REIMBURSEMENT_CATEGORY = "Reimbursement";

export const reimbursementClaimSchema = z.object({
  category: z.string().trim().min(1, "Kategori wajib diisi").max(100),
  amount: z.number().int().min(1, "Nominal harus lebih dari 0").max(1_000_000_000),
  description: z.string().trim().min(3, "Keterangan wajib diisi").max(1000),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  receiptNumber: z.string().trim().max(100).optional().nullable(),
  proofUrl: z.string().max(950_000).regex(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/, "Bukti harus berupa gambar (PNG/JPG/WebP) atau PDF").optional().nullable(),
  processInPayroll: z.boolean().optional(),
});
export type ReimbursementClaimInput = z.infer<typeof reimbursementClaimSchema>;

export class ReimbursementError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function nextClaimNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(reimbursementClaims).where(eq(reimbursementClaims.tenantId, tenantId));
  let n = count + 1;
  for (;;) {
    const candidate = `CLM-${year}-${String(n).padStart(4, "0")}`;
    const [clash] = await db.select({ id: reimbursementClaims.id }).from(reimbursementClaims).where(and(eq(reimbursementClaims.tenantId, tenantId), eq(reimbursementClaims.claimNumber, candidate))).limit(1);
    if (!clash) return candidate;
    n += 1;
  }
}

/** A claim is always born "Menunggu Review" with an Approval Engine item (approver = the employee's real manager); status/approvedAmount are never client input. */
export async function createReimbursementClaim(params: { tenantId: string; employeeId: string; actorUserId: string | null; input: ReimbursementClaimInput }) {
  const { tenantId, employeeId, input } = params;
  const [emp] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!emp) throw new ReimbursementError("Karyawan tidak ditemukan", 404);
  if (emp.status !== "Aktif") throw new ReimbursementError("Hanya karyawan aktif yang dapat mengajukan klaim.");
  const claimNumber = await nextClaimNumber(tenantId);
  const [claim] = await db
    .insert(reimbursementClaims)
    .values({ tenantId, employeeId, claimNumber, category: input.category, amount: input.amount, description: input.description, receiptDate: input.receiptDate, receiptNumber: input.receiptNumber ?? null, proofUrl: input.proofUrl ?? null, processInPayroll: input.processInPayroll ?? true })
    .returning();
  const steps = await buildApprovalSteps(tenantId, REIMBURSEMENT_CATEGORY, employeeId);
  const first = currentBlockingStep(steps);
  const [item] = await db
    .insert(approvalItems)
    .values({
      tenantId,
      category: REIMBURSEMENT_CATEGORY,
      referenceId: claim.id,
      title: `Klaim ${claim.category}: ${emp.fullName} (${claim.claimNumber})`,
      requesterId: employeeId,
      department: typeof (emp.details as Record<string, unknown>).department === "string" ? ((emp.details as Record<string, unknown>).department as string) : "Operasional",
      amount: claim.amount,
      steps,
      level: first?.level ?? 1,
      totalLevels: steps.length,
      assignedApproverRole: "manager",
      assignedApproverId: first?.approverEmployeeId ?? null,
      deadlineAt: first?.deadlineAt ? new Date(first.deadlineAt) : null,
      status: "Menunggu",
      notes: claim.description,
    })
    .returning();
  const [updated] = await db.update(reimbursementClaims).set({ approvalItemId: item.id }).where(eq(reimbursementClaims.id, claim.id)).returning();
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "reimbursement.submitted", details: { claimId: claim.id, claimNumber, amount: claim.amount, employeeId } });
  return updated;
}

export async function listReimbursementClaims(tenantId: string, employeeId?: string) {
  const where = employeeId ? and(eq(reimbursementClaims.tenantId, tenantId), eq(reimbursementClaims.employeeId, employeeId)) : eq(reimbursementClaims.tenantId, tenantId);
  return db.select().from(reimbursementClaims).where(where).orderBy(desc(reimbursementClaims.createdAt));
}

/** HR may exclude/include an approved claim from the next payroll run until it has actually been paid. */
export async function setClaimPayrollOptIn(tenantId: string, claimId: string, processInPayroll: boolean) {
  const [claim] = await db.select().from(reimbursementClaims).where(and(eq(reimbursementClaims.id, claimId), eq(reimbursementClaims.tenantId, tenantId))).limit(1);
  if (!claim) throw new ReimbursementError("Klaim tidak ditemukan", 404);
  if (claim.status !== "Disetujui") throw new ReimbursementError("Hanya klaim yang sudah disetujui yang dapat diatur masuk payroll.");
  if (claim.processedPeriod) throw new ReimbursementError(`Klaim sudah dibayarkan pada payroll ${claim.processedPeriod}.`, 409);
  const [updated] = await db.update(reimbursementClaims).set({ processInPayroll }).where(eq(reimbursementClaims.id, claimId)).returning();
  return updated;
}

finalizeHooks[REIMBURSEMENT_CATEGORY] = async (item, decidedByName) => {
  if (item.status === "Disetujui") {
    await db.update(reimbursementClaims).set({ status: "Disetujui", approvedBy: decidedByName }).where(eq(reimbursementClaims.id, item.referenceId));
    await db.update(reimbursementClaims).set({ approvedAmount: sql`${reimbursementClaims.amount}` }).where(eq(reimbursementClaims.id, item.referenceId));
  } else if (item.status === "Ditolak") {
    await db.update(reimbursementClaims).set({ status: "Ditolak", approvedBy: decidedByName, approvedAmount: 0, processInPayroll: false, notes: item.rejectionReason ?? null }).where(eq(reimbursementClaims.id, item.referenceId));
  }
};
