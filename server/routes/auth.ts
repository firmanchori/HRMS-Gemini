import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.ts";
import { users, passwordResetTokens, emailChangeRequests } from "../db/schema.ts";
import { issueSession, clearSession } from "../middleware/auth.ts";
import { generateToken, hashToken } from "../lib/token.ts";
import { sendPasswordResetEmail, sendEmailChangeConfirmation } from "../lib/email.ts";
import { validateBody } from "../lib/validate.ts";
import { authLimiter } from "../lib/rateLimit.ts";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/** Single login endpoint: context (App Owner vs tenant admin) comes from the resolved subdomain. */
authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const role = req.tenant ? "tenant_admin" : "app_owner";
  const whereClause = req.tenant
    ? and(eq(users.email, email), eq(users.role, role), eq(users.tenantId, req.tenant.id))
    : and(eq(users.email, email), eq(users.role, role), isNull(users.tenantId));

  const [user] = await db.select().from(users).where(whereClause).limit(1);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Email atau password salah" });
  }

  issueSession(res, { userId: user.id, role: user.role, tenantId: user.tenantId });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
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

authRouter.post("/reset-password/:token", authLimiter, validateBody(resetPasswordSchema), async (req, res) => {
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
