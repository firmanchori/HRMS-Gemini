/**
 * Minimal fetch helpers shared by utility pages (reset-password,
 * confirm-email) that must work on BOTH the App Owner bare domain and a
 * tenant subdomain — the backend infers which one from the Origin header
 * automatically, so these calls don't need to know or care which context
 * they're running in.
 */
import { getCsrfHeader } from "./csrf";

// Relative by default — see src/tenant/api.ts for why (same-site cookie via the dev proxy).
const API_BASE = import.meta.env.VITE_API_BASE || "";

export class AuthApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getCsrfHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "app_owner" | "tenant_admin";
}

export interface DevAccount {
  name: string;
  email: string;
  role: string;
  password: string | null;
}

export interface MfaStatus {
  enabled: boolean;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface MfaConfirmResponse {
  ok: true;
  backupCodes: string[];
}

/** Either a completed login, or a signal that a second (TOTP/backup code) step is still needed before a real session exists. */
export type LoginResult = AuthUser | { mfaRequired: true };

export const authApi = {
  login: (email: string, password: string) => post<LoginResult>("/api/auth/login", { email, password }),
  /** Second step of login when login() returned { mfaRequired: true } — consumes the pending ticket cookie and, on a correct code, issues the real session. */
  verifyMfaLogin: (code: string) => post<AuthUser>("/api/auth/mfa/verify-login", { code }),
  logout: () => post<{ ok: true }>("/api/auth/logout"),
  forgotPassword: (email: string) => post<{ ok: true }>("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    post<{ ok: true }>(`/api/auth/reset-password/${token}`, { newPassword }),
  confirmEmail: (token: string) => post<{ ok: true }>(`/api/auth/confirm-email/${token}`),
  // Dev/test convenience only — the backend hides this (404) outside development.
  listDevAccounts: () => get<DevAccount[]>("/api/auth/dev-accounts"),
  /** Checks the httpOnly session cookie against the current subdomain; rejects (throws) if there's no valid session. */
  me: () => get<AuthUser>("/api/auth/me"),
  mfaStatus: () => get<MfaStatus>("/api/auth/mfa/status"),
  mfaSetup: () => post<MfaSetupResponse>("/api/auth/mfa/setup"),
  mfaConfirm: (code: string) => post<MfaConfirmResponse>("/api/auth/mfa/confirm", { code }),
  mfaDisable: (password: string) => post<{ ok: true }>("/api/auth/mfa/disable", { password }),
};
