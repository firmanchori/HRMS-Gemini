import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, isNull, gte, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { users, passwordResetTokens, emailChangeRequests, auditLogEntries } from "../db/schema.ts";
import QRCode from "qrcode";
import { issueSession, clearSession, readSession, issueMfaTicket, readMfaTicket, clearMfaTicket, requireAnySession } from "../middleware/auth.ts";
import { generateToken, hashToken } from "../lib/token.ts";
import { sendPasswordResetEmail, sendEmailChangeConfirmation } from "../lib/email.ts";
import { validateBody } from "../lib/validate.ts";
import { authLimiter } from "../lib/rateLimit.ts";
import { logAudit } from "../lib/audit.ts";
import { encryptSecret, decryptSecret } from "../lib/crypto.ts";
import { generateTotpSecret, totpOtpauthUrl, verifyTotpCode, generateBackupCodes, hashBackupCode, consumeBackupCode } from "../lib/totp.ts";
import { rejectBreachedPassword } from "../middleware/passwordCheck.ts";

export const authRouter = Router();

const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_THRESHOLD = 5;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/**
 * Logs every login attempt (success and failure) — found missing during
 * the security review (user, 2026-11-09): there was no record anywhere of
 * failed attempts, so a brute-force or credential-stuffing run against
 * this endpoint would leave no trace to investigate afterward, only the
 * rate limiter's in-memory counter (which isn't queryable and resets).
 * Never logs the password itself. actorUserId is the matched user's id
 * when the email exists (even on a wrong-password failure) — lets you
 * tell "repeated wrong password against one real account" apart from
 * "scanning random emails" in the resulting log.
 */
export async function logLoginAttempt(params: {
  tenantId: string | null;
  actorUserId: string | null;
  email: string;
  outcome: "success" | "failure";
  reason?: string;
  ip: string;
}) {
  await logAudit({
    actorUserId: params.actorUserId,
    tenantId: params.tenantId,
    action: params.outcome === "success" ? "auth.login_success" : "auth.login_failed",
    details: { email: params.email, reason: params.reason, ip: params.ip },
  });
}

/**
 * Shared by every login endpoint (admin, employee) — see the lockout
 * comment in /login below for why this exists alongside authLimiter.
 * Only counts reason "invalid_credentials" (an actual wrong-password
 * guess) toward the threshold — NOT a tenant-status rejection like
 * "tenant_Suspended" or "account_disabled", which happen with a fully
 * correct password and carry no brute-force signal at all; counting
 * those meant a suspended tenant's admin trying to log in a few times
 * (or a flaky CI re-running this suite, which deliberately exercises
 * that exact rejection path) could lock out the real password check.
 */
export async function isAccountLockedOut(tenantId: string | null, email: string): Promise<boolean> {
  const recentFailuresSince = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
  const tenantFilter = tenantId ? eq(auditLogEntries.tenantId, tenantId) : isNull(auditLogEntries.tenantId);
  const [{ count: recentFailures }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogEntries)
    .where(
      and(
        eq(auditLogEntries.action, "auth.login_failed"),
        sql`${auditLogEntries.details}->>'email' = ${email}`,
        sql`${auditLogEntries.details}->>'reason' = 'invalid_credentials'`,
        tenantFilter,
        gte(auditLogEntries.createdAt, recentFailuresSince)
      )
    );
  return Number(recentFailures) >= LOCKOUT_THRESHOLD;
}

export { LOCKOUT_WINDOW_MINUTES };

/** Single login endpoint: context (App Owner vs tenant admin) comes from the resolved subdomain. */
authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const tenantId = req.tenant?.id ?? null;
  const ip = req.ip ?? "unknown";

  // Credential-stuffing / brute-force lockout: authLimiter above throttles
  // by IP, which a distributed stuffing run simply routes around — this
  // counts failures against this one account instead, from the very audit
  // log rows /login already writes, so no new table is needed. Checked
  // before the password itself so repeated guesses against a real account
  // get locked out even once the attacker finds the right IP-spread.
  if (await isAccountLockedOut(tenantId, email)) {
    return res.status(429).json({ error: `Terlalu banyak percobaan login gagal untuk akun ini. Coba lagi dalam ${LOCKOUT_WINDOW_MINUTES} menit.` });
  }

  const role = req.tenant ? "tenant_admin" : "app_owner";
  const whereClause = req.tenant
    ? and(eq(users.email, email), eq(users.role, role), eq(users.tenantId, req.tenant.id))
    : and(eq(users.email, email), eq(users.role, role), isNull(users.tenantId));

  const [user] = await db.select().from(users).where(whereClause).limit(1);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    await logLoginAttempt({ tenantId, actorUserId: user?.id ?? null, email, outcome: "failure", reason: "invalid_credentials", ip });
    return res.status(401).json({ error: "Email atau password salah" });
  }

  // Correct credentials alone aren't enough — a tenant that isn't Active
  // (still PendingPayment, Suspended, Expired, or Cancelled) must never be
  // able to log in, checked AFTER the password so a wrong-password attempt
  // never leaks the tenant's status to someone without valid credentials.
  if (req.tenant && req.tenant.status !== "Active") {
    const statusMessages: Record<string, string> = {
      PendingPayment: "Akun perusahaan Anda masih menunggu verifikasi pembayaran.",
      Suspended: "Akun perusahaan Anda sedang ditangguhkan. Hubungi App Owner untuk informasi lebih lanjut.",
      Expired: "Masa aktif langganan perusahaan Anda sudah berakhir.",
      Cancelled: "Akun perusahaan Anda sudah tidak aktif.",
    };
    await logLoginAttempt({ tenantId, actorUserId: user.id, email, outcome: "failure", reason: `tenant_${req.tenant.status}`, ip });
    return res.status(403).json({ error: statusMessages[req.tenant.status] ?? "Akun perusahaan Anda tidak aktif." });
  }

  // A correct password isn't the whole login when MFA is enabled — issue
  // only a short-lived pending ticket, never the real session cookie, so a
  // stolen/guessed password alone still can't reach anything. The actual
  // session is only minted by /mfa/verify-login once the TOTP/backup code
  // also checks out.
  if (user.totpEnabled) {
    await logLoginAttempt({ tenantId, actorUserId: user.id, email, outcome: "success", reason: "password_ok_awaiting_mfa", ip });
    issueMfaTicket(res, { userId: user.id, role: user.role, tenantId: user.tenantId });
    return res.json({ mfaRequired: true });
  }

  await logLoginAttempt({ tenantId, actorUserId: user.id, email, outcome: "success", ip });
  issueSession(res, { userId: user.id, role: user.role, tenantId: user.tenantId });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

const mfaVerifyLoginSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

/** Second step of login when the account has MFA enabled — consumes the pending ticket from /login and, on a correct TOTP or backup code, issues the real session. */
authRouter.post("/mfa/verify-login", authLimiter, validateBody(mfaVerifyLoginSchema), async (req, res) => {
  const { code } = req.body;
  const ticket = readMfaTicket(req);
  if (!ticket) return res.status(401).json({ error: "Sesi verifikasi kedaluwarsa, silakan login ulang" });

  const [user] = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
  if (!user || !user.totpEnabled || !user.totpSecretEncrypted) {
    clearMfaTicket(res);
    return res.status(401).json({ error: "Sesi verifikasi tidak valid, silakan login ulang" });
  }

  const ip = req.ip ?? "unknown";
  const secret = decryptSecret(user.totpSecretEncrypted);
  let valid = verifyTotpCode(secret, code);

  if (!valid && user.totpBackupCodesHash?.length) {
    const remaining = consumeBackupCode(user.totpBackupCodesHash, code);
    if (remaining) {
      valid = true;
      await db.update(users).set({ totpBackupCodesHash: remaining }).where(eq(users.id, user.id));
    }
  }

  if (!valid) {
    await logLoginAttempt({ tenantId: user.tenantId, actorUserId: user.id, email: user.email, outcome: "failure", reason: "invalid_mfa_code", ip });
    return res.status(401).json({ error: "Kode verifikasi salah" });
  }

  clearMfaTicket(res);
  issueSession(res, { userId: user.id, role: user.role, tenantId: user.tenantId });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

/** Current MFA status for the logged-in account — drives the UI's "aktif/tidak aktif" state, replacing the hardcoded claim that used to sit in Header.tsx. */
authRouter.get("/mfa/status", requireAnySession, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Belum login" });
  res.json({ enabled: user.totpEnabled });
});

/**
 * Starts (or restarts) enrollment: generates a fresh secret, stores it
 * encrypted right away, but leaves totpEnabled false — a half-finished
 * enrollment (user never scans the QR, or scans it wrong) must never lock
 * anyone out, and never silently turns MFA on either. /mfa/confirm is the
 * only route that flips totpEnabled to true.
 */
authRouter.post("/mfa/setup", requireAnySession, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Belum login" });
  if (user.totpEnabled) return res.status(400).json({ error: "MFA sudah aktif untuk akun ini. Matikan dulu sebelum mengatur ulang." });

  const secret = generateTotpSecret();
  await db.update(users).set({ totpSecretEncrypted: encryptSecret(secret) }).where(eq(users.id, user.id));

  const otpauthUrl = totpOtpauthUrl(secret, user.email, "NusaHR");
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  res.json({ secret, otpauthUrl, qrCodeDataUrl });
});

const mfaConfirmSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

/** Completes enrollment: the code must actually match the secret /mfa/setup just stored, proving the user really scanned/entered it, before MFA is turned on. Returns the one-time backup codes — only their hashes are ever stored. */
authRouter.post("/mfa/confirm", requireAnySession, validateBody(mfaConfirmSchema), async (req, res) => {
  const { code } = req.body;
  const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Belum login" });
  if (user.totpEnabled) return res.status(400).json({ error: "MFA sudah aktif untuk akun ini." });
  if (!user.totpSecretEncrypted) return res.status(400).json({ error: "Belum ada proses pengaturan MFA yang berjalan. Mulai dari /mfa/setup." });

  const secret = decryptSecret(user.totpSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    return res.status(400).json({ error: "Kode verifikasi salah" });
  }

  const backupCodes = generateBackupCodes();
  await db
    .update(users)
    .set({ totpEnabled: true, totpBackupCodesHash: backupCodes.map(hashBackupCode) })
    .where(eq(users.id, user.id));
  await logAudit({ actorUserId: user.id, tenantId: user.tenantId, action: "auth.mfa_enabled", details: {} });

  res.json({ ok: true, backupCodes });
});

const mfaDisableSchema = z.object({
  password: z.string().min(1).max(200),
});

/** Turning MFA off requires the current password again — otherwise a hijacked already-open session (e.g. an unattended unlocked laptop) could silently downgrade the account's own protection. */
authRouter.post("/mfa/disable", requireAnySession, validateBody(mfaDisableSchema), async (req, res) => {
  const { password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Password salah" });
  }

  await db
    .update(users)
    .set({ totpEnabled: false, totpSecretEncrypted: null, totpBackupCodesHash: null })
    .where(eq(users.id, user.id));
  await logAudit({ actorUserId: user.id, tenantId: user.tenantId, action: "auth.mfa_disabled", details: {} });

  res.json({ ok: true });
});

// The one password every account seeded by this repo's dev tooling uses
// (server/db/seed/examples.ts, APP_OWNER_SEED_PASSWORD default). Never a
// real signup-created password — we can't recover those from a bcrypt hash,
// so this stays null for any account that doesn't match it.
const DEV_TEST_PASSWORD = "ChangeMe123!";

/**
 * Dev/test convenience only — lists the accounts for whichever context this
 * request resolved to (tenant admins on a subdomain, App Owner on the bare
 * domain), with the password filled in ONLY when it actually matches the
 * known seed password (checked via bcrypt.compare, never assumed). Hidden
 * entirely outside development so it can never leak real credentials.
 */
authRouter.get("/dev-accounts", async (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not found" });

  const role = req.tenant ? "tenant_admin" : "app_owner";
  const whereClause = req.tenant ? and(eq(users.role, role), eq(users.tenantId, req.tenant.id)) : and(eq(users.role, role), isNull(users.tenantId));
  const rows = await db.select().from(users).where(whereClause);

  const accounts = await Promise.all(
    rows.map(async (u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      password: u.passwordHash && (await bcrypt.compare(DEV_TEST_PASSWORD, u.passwordHash)) ? DEV_TEST_PASSWORD : null,
    }))
  );
  res.json(accounts);
});

/**
 * Lets the frontend ask "am I still logged in?" on page load/refresh —
 * without this, a refresh has no way to tell a valid httpOnly session cookie
 * apart from no session at all, so it always fell back to the login screen
 * even right after a successful login.
 */
authRouter.get("/me", async (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "Belum login" });

  if (session.role === "app_owner") {
    if (req.tenant !== null) return res.status(403).json({ error: "Sesi tidak cocok dengan domain ini" });
  } else {
    if (!req.tenant || session.tenantId !== req.tenant.id) return res.status(403).json({ error: "Sesi tidak cocok dengan subdomain ini" });
    if (req.tenant.status !== "Active") return res.status(403).json({ error: "Akun perusahaan Anda tidak aktif" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Belum login" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;

  const role = req.tenant ? "tenant_admin" : "app_owner";
  const whereClause = req.tenant
    ? and(eq(users.email, email), eq(users.role, role), eq(users.tenantId, req.tenant.id))
    : and(eq(users.email, email), eq(users.role, role), isNull(users.tenantId));
  const [user] = await db.select().from(users).where(whereClause).limit(1);

  // Always respond ok (don't leak whether the email exists) — but only send if found.
  if (user) {
    const { token, tokenHash } = generateToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await sendPasswordResetEmail(user.email, token, req.tenant?.subdomain ?? null);
  }
  res.json({ ok: true });
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(200),
});

authRouter.post("/reset-password/:token", authLimiter, validateBody(resetPasswordSchema), rejectBreachedPassword((req) => req.body.newPassword), async (req, res) => {
  const { newPassword } = req.body;

  const tokenHash = hashToken(req.params.token);
  const [resetRow] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!resetRow || resetRow.usedAt || resetRow.expiresAt < new Date()) {
    return res.status(400).json({ error: "Tautan reset password tidak valid atau sudah kedaluwarsa" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, resetRow.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetRow.id));
  res.json({ ok: true });
});

authRouter.post("/confirm-email/:token", async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const [changeRow] = await db
    .select()
    .from(emailChangeRequests)
    .where(eq(emailChangeRequests.tokenHash, tokenHash))
    .limit(1);

  if (!changeRow || changeRow.confirmedAt || changeRow.expiresAt < new Date()) {
    return res.status(400).json({ error: "Tautan konfirmasi email tidak valid atau sudah kedaluwarsa" });
  }

  await db.update(users).set({ email: changeRow.newEmail }).where(eq(users.id, changeRow.userId));
  await db
    .update(emailChangeRequests)
    .set({ confirmedAt: new Date() })
    .where(eq(emailChangeRequests.id, changeRow.id));
  res.json({ ok: true });
});

// Re-exported so appOwner.ts can trigger an email-change request on a tenant admin.
export async function createEmailChangeRequest(userId: string, newEmail: string, subdomain: string | null) {
  const { token, tokenHash } = generateToken();
  await db.insert(emailChangeRequests).values({
    userId,
    newEmail,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  await sendEmailChangeConfirmation(newEmail, token, subdomain);
}
