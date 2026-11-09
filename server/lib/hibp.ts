import crypto from "node:crypto";

/**
 * Checks a password against Have I Been Pwned's breached-password corpus
 * via k-anonymity (only the first 5 hex chars of its SHA-1 hash are ever
 * sent — the full password, and even its full hash, never leave this
 * server). This is the credential-stuffing mitigation that actually
 * addresses the attack: stuffed credentials are by definition passwords
 * already exposed in a prior breach, so refusing to let anyone set one
 * stops the account from ever being stuffable with it in the first place.
 *
 * Fails open (returns false = "not known breached") on any network/API
 * error — a third-party outage must never block legitimate signups or
 * password resets. This is defense-in-depth, not the only defense.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const sha1 = crypto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some((line) => line.split(":")[0].trim() === suffix);
  } catch {
    return false;
  }
}
