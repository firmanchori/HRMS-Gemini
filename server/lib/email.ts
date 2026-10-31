import { Resend } from "resend";
import nodemailer from "nodemailer";
import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client.ts";
import { emailConfigs } from "../db/schema.ts";
import { decryptSecret } from "./crypto.ts";

interface ResolvedMailer {
  provider: "resend" | "smtp";
  fromName: string;
  fromEmail: string;
  resendApiKey?: string;
  smtp?: { host: string; port: number; username: string; password: string; secure: boolean };
}

/**
 * Resolves which mailer config to use: a tenant's own override (the "pakai
 * email perusahaan sendiri" requirement) if it has one and is active,
 * otherwise the platform-wide config (tenantId IS NULL), otherwise the
 * legacy env-var bootstrap so existing setups keep working until someone
 * saves a config via the App Owner "Pengaturan Email" screen.
 */
async function resolveMailer(tenantId?: string | null): Promise<ResolvedMailer | null> {
  if (tenantId) {
    const [tenantConfig] = await db
      .select()
      .from(emailConfigs)
      .where(eq(emailConfigs.tenantId, tenantId))
      .limit(1);
    if (tenantConfig?.isActive) return toResolved(tenantConfig);
  }

  const [platformConfig] = await db.select().from(emailConfigs).where(isNull(emailConfigs.tenantId)).limit(1);
  if (platformConfig?.isActive) return toResolved(platformConfig);

  if (process.env.RESEND_API_KEY) {
    return {
      provider: "resend",
      fromName: "NusaHR",
      fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      resendApiKey: process.env.RESEND_API_KEY,
    };
  }
  return null;
}

function toResolved(row: typeof emailConfigs.$inferSelect): ResolvedMailer {
  if (row.provider === "smtp") {
    return {
      provider: "smtp",
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      smtp: {
        host: row.smtpHost!,
        port: row.smtpPort!,
        username: row.smtpUsername!,
        password: decryptSecret(row.smtpPasswordEncrypted!),
        secure: row.smtpSecure,
      },
    };
  }
  return {
    provider: "resend",
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    resendApiKey: decryptSecret(row.resendApiKeyEncrypted!),
  };
}

async function send(to: string, subject: string, html: string, tenantId?: string | null) {
  const mailer = await resolveMailer(tenantId);
  if (!mailer) {
    console.warn(`[email] no mailer configured — skipping send to ${to}: ${subject}`);
    return;
  }
  const from = `${mailer.fromName} <${mailer.fromEmail}>`;

  if (mailer.provider === "resend") {
    const resend = new Resend(mailer.resendApiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] Resend error sending to ${to}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: mailer.smtp!.host,
    port: mailer.smtp!.port,
    secure: mailer.smtp!.secure,
    auth: { user: mailer.smtp!.username, pass: mailer.smtp!.password },
  });
  await transporter.sendMail({ from, to, subject, html });
}

/**
 * For notification emails that are a side-effect of an action that already
 * succeeded (token created, tenant activated, etc.) — a provider hiccup
 * must not fail the whole request and must not hide the fact that the
 * token/record itself was created. Logs and swallows; callers that need to
 * know delivery succeeded (e.g. the Inbox "Reply" button) should call
 * `send*` directly instead. Exported for ad-hoc notifications from route
 * handlers — see .claude/security-hardening-rules.md §1.
 */
export async function sendSafe(to: string, subject: string, html: string, tenantId?: string | null) {
  try {
    await send(to, subject, html, tenantId);
  } catch (err) {
    console.error(`[email] non-fatal: failed to send "${subject}" to ${to}`, err);
  }
}

function tenantUrl(subdomain: string, path: string): string {
  const base = process.env.APP_BASE_DOMAIN || "localhost:3000";
  const protocol = base.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${subdomain}.${base}${path}`;
}

function ownerUrl(path: string): string {
  const base = process.env.APP_BASE_DOMAIN || "localhost:3000";
  const protocol = base.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${base}${path}`;
}

export async function sendSignupPendingEmail(to: string, tenantName: string) {
  await sendSafe(
    to,
    "Pendaftaran NusaHR Diterima — Menunggu Verifikasi",
    `<p>Pendaftaran <strong>${tenantName}</strong> sudah kami terima dan sedang menunggu verifikasi pembayaran. Kami akan mengirim email begitu akun Anda aktif.</p>`
  );
}

export async function sendTenantActivatedEmail(to: string, tenantName: string, subdomain: string) {
  await sendSafe(
    to,
    "Akun NusaHR Anda Sudah Aktif",
    `<p>Akun <strong>${tenantName}</strong> sudah aktif. Silakan masuk di <a href="${tenantUrl(subdomain, "/login")}">${tenantUrl(subdomain, "/login")}</a>.</p>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string, subdomain: string | null, tenantId?: string | null) {
  const link = subdomain ? tenantUrl(subdomain, `/reset-password/${token}`) : ownerUrl(`/reset-password/${token}`);
  await sendSafe(
    to,
    "Reset Password NusaHR",
    `<p>Klik tautan berikut untuk mengatur ulang password Anda (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p>`,
    tenantId
  );
}

export async function sendEmailChangeConfirmation(to: string, token: string, subdomain: string | null, tenantId?: string | null) {
  const link = subdomain ? tenantUrl(subdomain, `/confirm-email/${token}`) : ownerUrl(`/confirm-email/${token}`);
  await sendSafe(
    to,
    "Konfirmasi Perubahan Email NusaHR",
    `<p>Klik tautan berikut untuk mengonfirmasi email baru Anda (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p>`,
    tenantId
  );
}

export async function sendContactReplyEmail(to: string, subject: string, replyBody: string) {
  await send(to, `Re: ${subject}`, `<p>${replyBody.replace(/\n/g, "<br/>")}</p>`);
}
