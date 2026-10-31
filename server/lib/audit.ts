import { db } from "../db/client.ts";
import { auditLogEntries } from "../db/schema.ts";

export async function logAudit(params: {
  actorUserId: string | null;
  tenantId: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLogEntries).values({
    actorUserId: params.actorUserId,
    tenantId: params.tenantId,
    action: params.action,
    details: params.details ?? {},
  });
}
