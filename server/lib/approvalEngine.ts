import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { approvalItems, approvalWorkflowConfigs, approvalDelegations, employees, type ApprovalStepState } from "../db/schema.ts";

/**
 * Server-side Approval Engine (business-process redesign, user 2026-11-10:
 * "Approval Engine ... harus benar benar di implementasikan"). The browser
 * used to decide everything — level advance with hardcoded roles, who may
 * approve, whether a level can be skipped — so none of it was enforceable.
 * Everything below runs on the server: approvers come from the real org
 * hierarchy (employees.managerId), a decision is only accepted from the
 * current step's actual approver (or their active delegate), steps can't be
 * skipped, a reject needs a reason, "mengetahui" steps are recorded but
 * never block, and the requester can never approve their own request.
 */

export const DEFAULT_STEPS = [{ mode: "approve" as const, label: "Persetujuan Atasan Langsung", approverType: "direct_manager" as const, slaHours: 48 }];

type StepConfig = { mode: "approve" | "acknowledge"; label: string; approverType: ApprovalStepState["approverType"]; approverRoleKey?: string | null; approverEmployeeId?: string | null; slaHours: number };

export async function getWorkflowSteps(tenantId: string, category: string): Promise<StepConfig[]> {
  const [cfg] = await db
    .select()
    .from(approvalWorkflowConfigs)
    .where(and(eq(approvalWorkflowConfigs.tenantId, tenantId), eq(approvalWorkflowConfigs.category, category)))
    .limit(1);
  return cfg?.steps?.length ? cfg.steps : DEFAULT_STEPS;
}

async function managerOf(tenantId: string, employeeId: string | null): Promise<string | null> {
  if (!employeeId) return null;
  const [row] = await db.select({ managerId: employees.managerId }).from(employees).where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId))).limit(1);
  return row?.managerId ?? null;
}

/** Turns a category's configured steps into per-instance step state, resolving each approver from the requester's REAL reporting line. */
export async function buildApprovalSteps(tenantId: string, category: string, requesterId: string, submittedAt = new Date()): Promise<ApprovalStepState[]> {
  const configs = await getWorkflowSteps(tenantId, category);
  const directManager = await managerOf(tenantId, requesterId);
  const managerChain2 = await managerOf(tenantId, directManager);
  let cursor = submittedAt.getTime();
  let level = 0;
  return configs.map((c) => {
    level += 1;
    let approverEmployeeId: string | null = null;
    if (c.approverType === "direct_manager") approverEmployeeId = directManager;
    else if (c.approverType === "manager_of_manager") approverEmployeeId = managerChain2 ?? directManager;
    else if (c.approverType === "employee") approverEmployeeId = c.approverEmployeeId ?? null;
    cursor += c.slaHours * 3600 * 1000;
    return {
      level,
      mode: c.mode,
      label: c.label,
      approverType: c.approverType,
      approverRoleKey: c.approverRoleKey ?? null,
      approverEmployeeId,
      slaHours: c.slaHours,
      deadlineAt: new Date(cursor).toISOString(),
      decision: null,
      decidedByEmployeeId: null,
      decidedByName: null,
      decidedAt: null,
      reason: null,
    };
  });
}

/** First undecided step that actually blocks the chain. */
export function currentBlockingStep(steps: ApprovalStepState[]): ApprovalStepState | null {
  return steps.find((s) => s.mode === "approve" && !s.decision) ?? null;
}

export async function activeDelegatorIds(tenantId: string, substituteEmployeeId: string, now = new Date()): Promise<string[]> {
  const rows = await db
    .select()
    .from(approvalDelegations)
    .where(and(eq(approvalDelegations.tenantId, tenantId), eq(approvalDelegations.substituteId, substituteEmployeeId), eq(approvalDelegations.isActive, true)));
  return rows.filter((r) => r.startDate <= now && r.endDate >= now).map((r) => r.principalId);
}

export type DecisionActor =
  | { kind: "admin"; userId: string; name: string }
  | { kind: "employee"; employeeId: string; name: string; hasRolePermission: (roleKey: string) => Promise<boolean> };

export class ApprovalError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Items still pending whose current step is overdue are reported as "Eskalasi Terlambat" (SLA is real now, not a static label). */
export function withDerivedStatus<T extends { status: string; steps: ApprovalStepState[] }>(item: T, now = new Date()): T {
  if (item.status !== "Menunggu") return item;
  const step = currentBlockingStep(item.steps);
  if (step?.deadlineAt && new Date(step.deadlineAt) < now) return { ...item, status: "Eskalasi Terlambat" };
  return item;
}

export async function decideApproval(params: { tenantId: string; itemId: string; actor: DecisionActor; decision: "Disetujui" | "Ditolak" | "Diketahui"; reason?: string | null }) {
  const { tenantId, itemId, actor, decision } = params;
  const reason = params.reason?.trim() || null;
  const [item] = await db.select().from(approvalItems).where(and(eq(approvalItems.id, itemId), eq(approvalItems.tenantId, tenantId))).limit(1);
  if (!item) throw new ApprovalError("Item approval tidak ditemukan", 404);
  if (item.status === "Disetujui" || item.status === "Ditolak") throw new ApprovalError("Pengajuan ini sudah diputuskan.", 400);
  if (decision === "Ditolak" && (!reason || reason.length < 3)) throw new ApprovalError("Alasan penolakan wajib diisi.", 400);

  const steps: ApprovalStepState[] = item.steps.map((s) => ({ ...s }));
  if (steps.length === 0) {
    // Legacy row created before the engine existed — only an admin may decide it, as a single implicit step.
    if (actor.kind !== "admin") throw new ApprovalError("Item lama hanya dapat diputuskan oleh admin.", 403);
    steps.push({ level: 1, mode: "approve", label: "Persetujuan", approverType: "role", approverEmployeeId: null, slaHours: 0, deadlineAt: null, decision: null, decidedByEmployeeId: null, decidedByName: null, decidedAt: null, reason: null });
  }

  const step = decision === "Diketahui" ? steps.find((s) => s.mode === "acknowledge" && !s.decision) : currentBlockingStep(steps);
  if (!step) throw new ApprovalError(decision === "Diketahui" ? "Tidak ada langkah 'mengetahui' yang menunggu." : "Tidak ada langkah persetujuan yang menunggu.", 400);
  if (decision === "Diketahui" && step.mode !== "acknowledge") throw new ApprovalError("Langkah ini bukan 'mengetahui'.", 400);
  if (decision !== "Diketahui" && step.mode !== "approve") throw new ApprovalError("Langkah ini hanya perlu diketahui.", 400);

  let viaDelegation = false;
  let byEmployeeId: string | null = null;
  if (actor.kind === "employee") {
    if (actor.employeeId === item.requesterId) throw new ApprovalError("Anda tidak dapat menyetujui pengajuan Anda sendiri.", 403);
    byEmployeeId = actor.employeeId;
    let allowed = false;
    if (step.approverEmployeeId) {
      if (step.approverEmployeeId === actor.employeeId) allowed = true;
      else if ((await activeDelegatorIds(tenantId, actor.employeeId)).includes(step.approverEmployeeId)) {
        allowed = true;
        viaDelegation = true;
      }
    } else if (step.approverRoleKey) {
      allowed = await actor.hasRolePermission(step.approverRoleKey);
    }
    if (!allowed) throw new ApprovalError("Anda bukan approver untuk langkah ini.", 403);
  }

  const now = new Date().toISOString();
  step.decision = decision;
  step.decidedByEmployeeId = byEmployeeId;
  step.decidedByName = actor.name;
  step.decidedAt = now;
  step.reason = reason;

  const history = [...item.history, { at: now, level: step.level, action: decision, byEmployeeId, byName: actor.name, reason, viaDelegation }];

  let status = item.status;
  let level = item.level;
  let assignedApproverId = item.assignedApproverId;
  if (decision === "Ditolak") {
    status = "Ditolak";
  } else {
    const next = currentBlockingStep(steps);
    if (!next) status = "Disetujui";
    else {
      status = "Menunggu";
      level = next.level;
      assignedApproverId = next.approverEmployeeId ?? item.assignedApproverId;
    }
  }

  const [updated] = await db
    .update(approvalItems)
    .set({ steps, history, status, level, totalLevels: Math.max(item.totalLevels, steps.length), assignedApproverId, rejectionReason: decision === "Ditolak" ? reason : item.rejectionReason })
    .where(eq(approvalItems.id, item.id))
    .returning();
  return updated;
}
