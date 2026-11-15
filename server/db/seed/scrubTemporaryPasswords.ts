/**
 * One-time cleanup (2026-11-15): earlier versions stored a plaintext
 * "temporaryPassword" inside onboarding task payloads. Passwords are no longer
 * created or stored that way (activation links instead) — this removes any
 * leftovers. Safe to re-run.
 *
 *   npx tsx server/db/seed/scrubTemporaryPasswords.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db, pool } from "../client.ts";
import { onboardingProcesses } from "../schema.ts";

function scrub(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => {
      const r = scrub(v);
      changed ||= r.changed;
      return r.value;
    });
    return { value: out, changed };
  }
  if (value && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "temporaryPassword") {
        changed = true;
        continue;
      }
      const r = scrub(v);
      changed ||= r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }
  return { value, changed: false };
}

const rows = await db.select().from(onboardingProcesses);
let fixed = 0;
for (const row of rows) {
  const t = scrub(row.tasks);
  const d = scrub(row.details);
  if (t.changed || d.changed) {
    await db.update(onboardingProcesses).set({ tasks: t.value as unknown[], details: d.value as Record<string, unknown> }).where(eq(onboardingProcesses.id, row.id));
    fixed += 1;
  }
}
console.log(`Scrubbed temporaryPassword from ${fixed} of ${rows.length} onboarding processes.`);
await pool.end();
