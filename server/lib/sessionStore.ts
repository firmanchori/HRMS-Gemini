import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "../db/client.ts";
import { sessions } from "../db/schema.ts";

/**
 * Server-side half of the session (security review, user 2026-11-10:
 * "Session Hijacking") — the JWT cookie only ever carries a `jti` pointing
 * at one of these rows; every privileged request re-checks the row is
 * still live here, so revoking a session takes effect immediately instead
 * of waiting out the JWT's own (up to 8h) expiry.
 */

export interface SessionRow {
  id: string;
  userId: string;
  role: string;
  tenantId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export async function createSessionRow(params: {
  userId: string;
  role: string;
  tenantId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<string> {
  const [row] = await db
    .insert(sessions)
    .values({
      userId: params.userId,
      role: params.role,
      tenantId: params.tenantId,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    })
    .returning({ id: sessions.id });
  return row.id;
}

/** Returns the row only if it exists and hasn't been revoked — null for either "never existed" or "revoked", deliberately not distinguished to the caller (both just mean "not a valid session anymore"). */
export async function getActiveSessionRow(sessionId: string): Promise<SessionRow | null> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
    .limit(1);
  return row ?? null;
}

/**
 * Updates lastSeenAt (and the device fingerprint, since a legitimate user's
 * browser/network genuinely does change over a session's lifetime) on every
 * authenticated request — cheap single-row update, and it's what makes
 * "sessions last used" meaningful on the self-service device list instead
 * of frozen at login time.
 */
export async function touchSessionRow(sessionId: string, userAgent: string | null, ipAddress: string | null) {
  await db
    .update(sessions)
    .set({ lastSeenAt: new Date(), userAgent, ipAddress })
    .where(eq(sessions.id, sessionId));
}

export async function revokeSessionRow(sessionId: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

/** Used by the self-service "logout other devices" action and by MFA/password-change flows that should invalidate every other session on the account. */
export async function revokeOtherSessionsForUser(userId: string, keepSessionId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId), isNull(sessions.revokedAt)));
}

/** Used when an admin disables/removes an account, or in incident response to a confirmed-compromised account — kills every live session for that user immediately, no exceptions. */
export async function revokeAllSessionsForUser(userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function listActiveSessionsForUser(userId: string) {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .orderBy(sessions.lastSeenAt);
}
