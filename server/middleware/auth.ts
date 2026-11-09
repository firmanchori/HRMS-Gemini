import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "nusahr_session";

interface SessionPayload {
  userId: string;
  role: "app_owner" | "tenant_admin";
  tenantId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

function secret(): string {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set — check .env.local");
  return process.env.JWT_SECRET;
}

export function issueSession(res: Response, payload: SessionPayload) {
  const token = jwt.sign(payload, secret(), { expiresIn: "8h" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // The dev frontend proxies /api/* through its own origin (see
    // vite.config.ts) so this always looks like a same-site request to the
    // browser, even though the tenant subdomain and this API are different
    // hosts underneath — SameSite=Lax is enough, and it's what keeps
    // automated tests (supertest, over plain HTTP) working too.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

const MFA_TICKET_COOKIE = "nusahr_mfa_ticket";

interface MfaTicketPayload {
  userId: string;
  role: "app_owner" | "tenant_admin";
  tenantId: string | null;
  purpose: "mfa_pending";
}

/**
 * A second-factor-pending ticket, issued instead of a real session once the
 * password has checked out but the account still needs its TOTP code. Kept
 * short-lived and in its own cookie so a correct password alone never grants
 * a usable session — /mfa/verify-login is the only route that can turn this
 * into a real session cookie.
 */
export function issueMfaTicket(res: Response, payload: Omit<MfaTicketPayload, "purpose">) {
  const token = jwt.sign({ ...payload, purpose: "mfa_pending" }, secret(), { expiresIn: "5m" });
  res.cookie(MFA_TICKET_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60 * 1000,
  });
}

export function readMfaTicket(req: Request): MfaTicketPayload | null {
  const token = req.cookies?.[MFA_TICKET_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as MfaTicketPayload;
    return payload.purpose === "mfa_pending" ? payload : null;
  } catch {
    return null;
  }
}

export function clearMfaTicket(res: Response) {
  res.clearCookie(MFA_TICKET_COOKIE);
}

/** Any logged-in account, App Owner or tenant admin — for self-service actions like managing one's own MFA that don't need the tenant/App-Owner boundary checks. */
export function requireAnySession(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "Harus login" });
  req.session = session;
  next();
}

export function readSession(req: Request): SessionPayload | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

/** Only a logged-in App Owner, on the bare base domain (req.tenant === null). */
export function requireAppOwner(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session || session.role !== "app_owner") {
    return res.status(401).json({ error: "Harus login sebagai App Owner" });
  }
  if (req.tenant !== null) {
    return res.status(403).json({ error: "Panel App Owner hanya bisa diakses dari domain utama" });
  }
  req.session = session;
  next();
}

/**
 * Only a logged-in tenant admin, AND the session's tenantId must match the
 * tenant resolved from the subdomain this request came in on — a session
 * minted on one tenant's subdomain must never work on another's. Also
 * re-checks the tenant is still Active on every request, not just at login
 * — otherwise suspending a tenant from the App Owner side would be
 * cosmetic until that admin's existing session naturally expires (up to
 * 8h later) instead of taking effect immediately.
 */
export function requireTenantAdmin(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session || session.role !== "tenant_admin") {
    return res.status(401).json({ error: "Harus login sebagai admin tenant" });
  }
  if (!req.tenant || session.tenantId !== req.tenant.id) {
    return res.status(403).json({ error: "Sesi tidak cocok dengan subdomain ini" });
  }
  if (req.tenant.status !== "Active") {
    return res.status(403).json({ error: "Akun perusahaan Anda tidak lagi aktif" });
  }
  req.session = session;
  next();
}
