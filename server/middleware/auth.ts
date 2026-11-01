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
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

function readSession(req: Request): SessionPayload | null {
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
