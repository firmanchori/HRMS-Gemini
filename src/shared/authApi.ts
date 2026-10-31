/**
 * Minimal fetch helpers shared by utility pages (reset-password,
 * confirm-email) that must work on BOTH the App Owner bare domain and a
 * tenant subdomain — the backend infers which one from the Origin header
 * automatically, so these calls don't need to know or care which context
 * they're running in.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export class AuthApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

export const authApi = {
  forgotPassword: (email: string) => post<{ ok: true }>("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    post<{ ok: true }>(`/api/auth/reset-password/${token}`, { newPassword }),
  confirmEmail: (token: string) => post<{ ok: true }>(`/api/auth/confirm-email/${token}`),
};
