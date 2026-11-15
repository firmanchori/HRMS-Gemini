import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { employeeAccounts, employeeAccountTokens, employees, tenants } from "../db/schema.ts";
import { generateToken, hashToken } from "./token.ts";
import { sendEmployeeAccountLinkEmail, employeeAccountLink } from "./email.ts";
import { revokeAllSessionsForUser } from "./sessionStore.ts";
import { logAudit } from "./audit.ts";

export class EmployeeAccountError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const ACTIVATION_TTL_MS = 7 * 24 * 3600 * 1000;
const RESET_TTL_MS = 3600 * 1000;

async function issueToken(accountId: string, purpose: "activation" | "reset") {
  const { token, tokenHash } = generateToken();
  await db.insert(employeeAccountTokens).values({ employeeAccountId: accountId, purpose, tokenHash, expiresAt: new Date(Date.now() + (purpose === "activation" ? ACTIVATION_TTL_MS : RESET_TTL_MS)) });
  return token;
}

/**
 * Creates the login account for an employee WITHOUT any password: the stored hash is of random bytes nobody knows, and the employee
 * sets their own password through a one-time link. If no mailer is configured the link is returned once to the admin to hand over;
 * when the email is delivered the link is NOT returned.
 */
export async function provisionEmployeeAccount(params: { tenantId: string; employeeId: string; email: string; roleKey: string; actorUserId: string | null }) {
  const { tenantId, employeeId } = params;
  const email = params.email.trim().toLowerCase();
  const [emp] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!emp) throw new EmployeeAccountError("Karyawan tidak ditemukan", 404);
  const [existing] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.employeeId, employeeId)).limit(1);
  if (existing) throw new EmployeeAccountError("Karyawan ini sudah memiliki akun login");
  const [emailTaken] = await db.select().from(employeeAccounts).where(and(eq(employeeAccounts.tenantId, tenantId), eq(employeeAccounts.email, email))).limit(1);
  if (emailTaken) throw new EmployeeAccountError("Email tersebut sudah digunakan untuk akun karyawan lain");

  const unusable = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  const [account] = await db.insert(employeeAccounts).values({ tenantId, employeeId, email, passwordHash: unusable, roleKey: params.roleKey, isActive: true }).returning();
  const token = await issueToken(account.id, "activation");
  const [tenant] = await db.select({ subdomain: tenants.subdomain }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const delivered = await sendEmployeeAccountLinkEmail(email, token, tenant.subdomain, "activation", tenantId);
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "employee_account.provisioned", details: { employeeId, email, delivery: delivered ? "email" : "manual" } });
  return {
    account: { id: account.id, employeeId, email, roleKey: account.roleKey, isActive: account.isActive },
    delivery: delivered ? ("email" as const) : ("manual" as const),
    // Only when no mail could be sent: shown once to the admin, never stored in the clear.
    activationLink: delivered ? null : employeeAccountLink(tenant.subdomain, token),
  };
}

export async function sendEmployeeResetLink(params: { tenantId: string; accountId: string; actorUserId: string | null }) {
  const [account] = await db.select().from(employeeAccounts).where(and(eq(employeeAccounts.id, params.accountId), eq(employeeAccounts.tenantId, params.tenantId))).limit(1);
  if (!account) throw new EmployeeAccountError("Akun karyawan tidak ditemukan", 404);
  const token = await issueToken(account.id, "reset");
  const [tenant] = await db.select({ subdomain: tenants.subdomain }).from(tenants).where(eq(tenants.id, params.tenantId)).limit(1);
  const delivered = await sendEmployeeAccountLinkEmail(account.email, token, tenant.subdomain, "reset", params.tenantId);
  await logAudit({ actorUserId: params.actorUserId, tenantId: params.tenantId, action: "employee_account.reset_link_sent", details: { employeeAccountId: account.id, delivery: delivered ? "email" : "manual" } });
  return { delivery: delivered ? ("email" as const) : ("manual" as const), resetLink: delivered ? null : employeeAccountLink(tenant.subdomain, token) };
}

/** Self-service "lupa password": always succeeds silently (no account enumeration); only mails when the account exists and is active. */
export async function requestEmployeeReset(tenantId: string, subdomain: string, emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const [account] = await db.select().from(employeeAccounts).where(and(eq(employeeAccounts.tenantId, tenantId), eq(employeeAccounts.email, email))).limit(1);
  if (!account || !account.isActive) return;
  const token = await issueToken(account.id, "reset");
  await sendEmployeeAccountLinkEmail(email, token, subdomain, "reset", tenantId);
}

/** Consumes an activation/reset link: sets the password, kills every existing session, makes the link unusable. Works once. */
export async function redeemEmployeeToken(tenantId: string, token: string, newPassword: string) {
  const [row] = await db.select().from(employeeAccountTokens).where(eq(employeeAccountTokens.tokenHash, hashToken(token))).limit(1);
  if (!row || row.usedAt || row.expiresAt < new Date()) throw new EmployeeAccountError("Tautan tidak valid atau sudah kedaluwarsa");
  const [account] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.id, row.employeeAccountId)).limit(1);
  if (!account || account.tenantId !== tenantId) throw new EmployeeAccountError("Tautan tidak valid atau sudah kedaluwarsa");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(employeeAccounts).set({ passwordHash }).where(eq(employeeAccounts.id, account.id));
  await db.update(employeeAccountTokens).set({ usedAt: new Date() }).where(eq(employeeAccountTokens.id, row.id));
  await revokeAllSessionsForUser(account.id);
  await logAudit({ actorUserId: null, tenantId, action: row.purpose === "activation" ? "employee_account.activated" : "employee_account.password_reset", details: { employeeAccountId: account.id } });
}
