import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employees } from "../db/schema.ts";

/** True when `assessorId` sits above `subjectId` in the real reporting line (managerId chain, any depth). Cycle-safe. */
export async function isInManagerChain(tenantId: string, assessorId: string, subjectId: string): Promise<boolean> {
  const seen = new Set<string>();
  let cursor: string | null = subjectId;
  for (let depth = 0; depth < 20 && cursor && !seen.has(cursor); depth++) {
    seen.add(cursor);
    const [row] = await db.select({ managerId: employees.managerId }).from(employees).where(and(eq(employees.id, cursor), eq(employees.tenantId, tenantId))).limit(1);
    cursor = row?.managerId ?? null;
    if (cursor === assessorId) return true;
  }
  return false;
}
