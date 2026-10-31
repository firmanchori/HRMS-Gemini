import crypto from "node:crypto";

/**
 * AES-256-GCM encryption for secrets that genuinely must live in the
 * database (SMTP passwords / API keys the App Owner or a tenant enters at
 * runtime — there's no env var for a per-tenant credential). Everything
 * that CAN stay in an env var still should (.claude/security-hardening-rules.md);
 * this is only for the cases where the whole point is runtime editability.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set — check .env.local");
  return crypto.createHash("sha256").update(raw).digest(); // normalizes any length into a 32-byte key
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** For display only — never send a stored secret back to the browser in full. */
export const SECRET_MASK = "••••••••••••";
