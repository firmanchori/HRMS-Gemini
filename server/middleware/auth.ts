import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { getPermission, type PermissionAction } from "../lib/permissions.ts";

const COOKIE_NAME = "nusahr_session";
const CSRF_COOKIE_NAME = "nusahr_csrf";

interface SessionPayload {
  // For role "employee" this holds employee_accounts.id, not employees.id
  // — employeeId below is the HR record itself, used to query
  // attendance/leave rows, which are keyed by employees.id.
  userId: string;
  role: "app_owner" | "tenant_admin" | "employee";
  tenantId: string | null;
  employeeId?: string;
  roleKey?: string;
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

  // Double-submit CSRF token (security review, user 2026-11-09: "CSRF juga
  // perlu di cek lagi"). SameSite=Lax + the strict CORS origin allowlist in
  // app.ts already block the cross-site credentialed JSON POST a classic
  // CSRF attack needs, but that relies on every browser actually enforcing
  // SameSite correctly — this is the explicit token mechanism as defense in
  // depth on top of it, not instead of it. Deliberately NOT httpOnly: the
  // frontend must be able to read it to echo it back in X-CSRF-Token; a
  // cross-site attacker can't read it either way (that's what SameSite +
  // CORS block), but a classic CSRF form/img-tag attack can't read ANY
  // cookie at all, so it could never echo the right value regardless.
  res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString("hex"), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME);
  res.clearCookie(CSRF_COOKIE_NAME);
}

/**
 * Self-heals a session that predates the CSRF feature (2026-11-09):
 * issueSession only ever mints the csrf cookie at login time, so every
 * session cookie already live in a browser before that change — still
 * valid for up to 8h — has no paired csrf cookie and would 403 on its
 * very next mutating request (confirmed live: "Token CSRF tidak valid
 * atau hilang" on Clock-In from a session that was logged in earlier).
 * Run globally, before requireCsrfToken, on every request including
 * GETs — the frontend's own session check (GET /api/auth/me or
 * /api/employee/me) fires on every page load, so this mints the missing
 * cookie before the user ever reaches a mutating action, with no need to
 * log out and back in.
 */
export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (req.cookies?.[COOKIE_NAME] && !req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString("hex"), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    });
  }
  next();
}

/**
 * Requires the X-CSRF-Token header to match the nusahr_csrf cookie on every
 * state-changing request that carries a session — applied globally in
 * app.ts, not per-router, so no new route can accidentally be added
 * without this protection. Skipped automatically for requests with no
 * session cookie at all (login/signup/forgot-password — there's no token
 * to check yet at that point, and CORS + the body being JSON-only already
 * cover pre-session endpoints).
 */
export function requireCsrfToken(req: Request, res: Response, next: NextFunction) {
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const hasSession = Boolean(req.cookies?.[COOKIE_NAME]);
  if (!isMutating || !hasSession) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get("X-CSRF-Token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Token CSRF tidak valid atau hilang" });
  }
  next();
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

/**
 * Only a logged-in employee (real ESS/MSS login, server/routes/employee.ts)
 * — same tenant-match and Active-tenant re-check as requireTenantAdmin,
 * since an employee session is just as capable of outliving a suspension
 * if nothing re-checks it on every request.
 */
export function requireEmployeeSession(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session || session.role !== "employee") {
    return res.status(401).json({ error: "Harus login sebagai karyawan" });
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

/**
 * Gates an employee route by the real role_permission_entries matrix
 * (RbacManagement.tsx's own matrix, now actually enforced server-side
 * instead of only hiding/showing UI) — this is the piece that was
 * missing entirely: hasPermission()/getRolePermission() used to only
 * ever be called from inside the RBAC settings screen itself, never from
 * any route that actually gates an action.
 */
export function requirePermission(moduleKey: string, action: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = req.session;
    if (!session || session.role !== "employee" || !session.roleKey) {
      return res.status(403).json({ error: "Tidak memiliki izin untuk tindakan ini" });
    }
    const permission = await getPermission(session.tenantId!, moduleKey, session.roleKey);
    if (!permission[action]) {
      return res.status(403).json({ error: "Anda tidak memiliki izin untuk tindakan ini" });
    }
    next();
  };
}
