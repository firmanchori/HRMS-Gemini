import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { sendSafe } from "./email.ts";

/**
 * Security alerting (OWASP A09 — Security Logging and Monitoring Failures;
 * security review, user 2026-11-10: "Logging/Alerting"). `logAudit()` only
 * ever wrote a row nobody was watching — this is the piece that actually
 * notifies a human when something security-relevant happens, so an
 * incident doesn't sit undiscovered in `audit_log_entries` until someone
 * thinks to go looking. Fails soft (same pattern as sendSafe) — an alert
 * that can't be delivered must never block or fail the security-relevant
 * action it's reporting on.
 */
export async function sendSecurityAlert(params: {
  /** null = platform-level event (App Owner side); a tenant id = alert that tenant's admins. */
  tenantId: string | null;
  subject: string;
  message: string;
}) {
  try {
    const recipients = params.tenantId
      ? await db
          .select({ email: users.email })
          .from(users)
          .where(and(eq(users.tenantId, params.tenantId), eq(users.role, "tenant_admin")))
      : await resolvePlatformSecurityRecipients();

    const html = `<p>${params.message}</p><p style="color:#64748b;font-size:12px">Notifikasi keamanan otomatis dari NusaHR — waktu kejadian: ${new Date().toISOString()}.</p>`;

    await Promise.all(recipients.map((r) => sendSafe(r.email, `[Keamanan] ${params.subject}`, html, params.tenantId)));
  } catch (err) {
    console.error("[alerts] non-fatal: failed to dispatch security alert", err);
  }
}

async function resolvePlatformSecurityRecipients(): Promise<{ email: string }[]> {
  const envList = process.env.SECURITY_ALERT_EMAILS;
  if (envList) {
    return envList
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
  }
  return db.select({ email: users.email }).from(users).where(eq(users.role, "app_owner"));
}
