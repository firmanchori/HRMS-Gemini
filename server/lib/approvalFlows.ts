import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { approvalItems, employees } from "../db/schema.ts";
import { buildApprovalSteps, currentBlockingStep } from "./approvalEngine.ts";

/** Categories whose approval items are created ONLY by the server when the request itself is created. A client can no longer open one. */
export const SERVER_MANAGED_CATEGORIES = new Set(["Cuti", "Lembur", "Pinjaman", "Perbaikan Presensi", "Tukar Shift", "Perjalanan Dinas", "Procurement PR", "Reimbursement", "Promosi/Personalia"]);

/**
 * Opens the Approval Engine item for a request that was just created. The steps and the approver come from the workflow config and the
 * requester's REAL reporting line; status is always "Menunggu". If the requester is unknown (e.g. an order with no employee), the
 * step has no named approver and only an admin (or a role holder) can decide it.
 */
export async function openApprovalItem(params: { tenantId: string; category: string; referenceId: string; title: string; requesterId: string | null; amount?: number | null; notes?: string | null }) {
  const requesterId = params.requesterId ?? "";
  const steps = await buildApprovalSteps(params.tenantId, params.category, requesterId);
  const first = currentBlockingStep(steps);
  let department = "Operasional";
  if (requesterId) {
    const [emp] = await db.select({ details: employees.details }).from(employees).where(eq(employees.id, requesterId)).limit(1);
    const d = (emp?.details as Record<string, unknown> | undefined)?.department;
    if (typeof d === "string" && d) department = d;
  }
  const [item] = await db
    .insert(approvalItems)
    .values({
      tenantId: params.tenantId,
      category: params.category,
      referenceId: params.referenceId,
      title: params.title,
      requesterId,
      department,
      amount: params.amount ?? null,
      steps,
      level: first?.level ?? 1,
      totalLevels: steps.length,
      assignedApproverRole: "manager",
      assignedApproverId: first?.approverEmployeeId ?? null,
      deadlineAt: first?.deadlineAt ? new Date(first.deadlineAt) : null,
      status: "Menunggu",
      notes: params.notes ?? null,
    })
    .returning();
  return item;
}
