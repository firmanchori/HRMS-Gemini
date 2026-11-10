import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { users, employeeAccounts } from "../db/schema.ts";
import { logAudit } from "./audit.ts";
import { sendSecurityAlert } from "./alerts.ts";
import type { SessionRow } from "./sessionStore.ts";

/**
 * Soft anomaly detection for session hijacking (security review, user
 * 2026-11-10) — a session suddenly used from a different IP AND a
 * different browser/OS than it was minted or last seen with is the
 * classic signature of a copied/stolen cookie (token theft replay from a
 * different machine). Deliberately a flag-and-log, never a hard block:
 * real users change IP constantly (mobile data ↔ wifi, VPN, office ↔
 * home) and User-Agent alone is attacker-controllable, so either signal
 * alone is too noisy to act on — only BOTH changing at once, on an
 * already-established session, is treated as suspicious enough to log
 * and alert on.
 */
export async function checkSessionAnomaly(params: {
  session: SessionRow;
  currentUserAgent: string | null;
  currentIp: string | null;
}) {
  const { session, currentUserAgent, currentIp } = params;

  const hadPriorFingerprint = Boolean(session.userAgent || session.ipAddress);
  const ipChanged = Boolean(session.ipAddress && currentIp && session.ipAddress !== currentIp);
  const uaChanged = Boolean(session.userAgent && currentUserAgent && session.userAgent !== currentUserAgent);

  if (!hadPriorFingerprint || !(ipChanged && uaChanged)) return;

  const email = await resolveEmailForAlert(session);

  await logAudit({
    actorUserId: session.userId,
    tenantId: session.tenantId,
    action: "auth.session_anomaly_detected",
    details: {
      email,
      previousIp: session.ipAddress,
      currentIp,
      previousUserAgent: session.userAgent,
      currentUserAgent,
    },
  });

  await sendSecurityAlert({
    tenantId: session.tenantId,
    subject: "Aktivitas sesi mencurigakan terdeteksi",
    message: `Sesi login untuk ${email} tiba-tiba digunakan dari perangkat dan alamat IP yang berbeda sekaligus (IP lama: ${session.ipAddress}, IP baru: ${currentIp}). Ini bisa menandakan sesi/cookie login dicuri. Jika ini bukan Anda, segera logout dari semua perangkat dan ganti password.`,
  });
}

async function resolveEmailForAlert(session: SessionRow): Promise<string> {
  if (session.role === "employee") {
    const [row] = await db.select({ email: employeeAccounts.email }).from(employeeAccounts).where(eq(employeeAccounts.id, session.userId)).limit(1);
    return row?.email ?? session.userId;
  }
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, session.userId)).limit(1);
  return row?.email ?? session.userId;
}
