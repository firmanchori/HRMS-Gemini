/**
 * Reads the double-submit CSRF token cookie (server/middleware/auth.ts's
 * requireCsrfToken) and returns it as a header object to spread into a
 * fetch call's headers. Harmless to include on every request, including
 * GET and pre-login calls — the cookie just won't exist yet, so this
 * returns {} and the backend only checks the header on state-changing
 * requests that already carry a session anyway.
 */
export function getCsrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|; )nusahr_csrf=([^;]+)/);
  return match ? { "X-CSRF-Token": decodeURIComponent(match[1]) } : {};
}
