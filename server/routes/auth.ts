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
