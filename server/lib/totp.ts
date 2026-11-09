import { authenticator } from "otplib";
import crypto from "node:crypto";

authenticator.options = { window: 1 }; // accept the previous/next 30s step too, for clock drift

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpOtpauthUrl(secret: string, accountLabel: string, issuer: string): string {
  return authenticator.keyuri(accountLabel, issuer, secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.check(code, secret);
  } catch {
    return false;
  }
}

/** 8 backup codes (xxxx-xxxx), returned once as plaintext — only their SHA-256 hashes are ever stored. */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

/** Consumes a backup code if valid (one-time use) — returns the remaining hash list, or null if the code didn't match any. */
export function consumeBackupCode(storedHashes: string[], suppliedCode: string): string[] | null {
  const hash = hashBackupCode(suppliedCode);
  const idx = storedHashes.indexOf(hash);
  if (idx === -1) return null;
  return [...storedHashes.slice(0, idx), ...storedHashes.slice(idx + 1)];
}
