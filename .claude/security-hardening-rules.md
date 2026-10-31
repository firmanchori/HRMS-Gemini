# Security & Resilience Standards — NusaHR Enterprise HRMS

Status: **MANDATORY standard for every backend and frontend piece built from
now on** (set by product owner, 31 Okt 2026) — not optional, not "nice to
have later." Every new API route and every new frontend screen is checked
against this file before being considered done, same weight as
`.claude/coding-standards.md` and `.claude/database-rules.md`.

## 1. System Resilience

- Every unhandled error in a request must return a clean error response
  (4xx/5xx JSON), **never crash the process**. `server/index.ts` already
  wraps routes with `express-async-errors` + a final error-handling
  middleware — any new route file must stay inside that pattern, not add
  its own unguarded async handler style.
- A side-effect that is not the primary purpose of the request (e.g.
  sending a notification email after a password-reset token was already
  created) must fail soft (log + continue), never fail the whole request —
  see `server/lib/email.ts`'s `sendSafe()` pattern. Apply the same
  "soft-fail non-critical side effect" principle to future integrations
  (SMS, webhooks, push notifications).
- Add a liveness endpoint (`/api/health`, already present) for every
  deployable service; extend it with a DB-ping check once more services
  exist, so uptime monitoring can tell "process alive" apart from "DB
  reachable."
- Rate-limit every endpoint that is expensive, sends an email, or is a
  plausible brute-force target (login, forgot-password, signup, contact)
  — see §3.

## 2. API Lifecycle & Session Management

- Session = short-lived signed JWT in an httpOnly cookie (`nusahr_session`),
  never in `localStorage`/`sessionStorage` (XSS-exfiltratable) and never
  returned in a JSON body.
- A session is scoped to exactly one role + one tenant (or `null` tenant
  for App Owner) at mint time (`server/middleware/auth.ts`). A session must
  never be usable on a different tenant's subdomain than the one it was
  issued on, and App-Owner sessions must never work on any tenant
  subdomain — both already enforced in `requireTenantAdmin`/
  `requireAppOwner`; every future role-specific middleware must keep this
  pattern.
- Cookie attributes are fixed: `httpOnly: true`, `sameSite: "lax"`,
  `secure: true` in production. Don't loosen these per-route.
- Version/namespace API routes under `/api/...` consistently; a breaking
  change to a response shape gets a new route or an explicit version
  segment, not a silent field rename on a route other code already calls.
- Document every route's request/response shape with a zod schema (§4) —
  the schema IS the contract, keep it next to the route it validates.

## 3. Backend Security Hardening / OWASP API Top 10 Mitigation

Mapped to the OWASP API Security Top 10 (2023) — every item below is a
concrete, checkable requirement, not a slogan:

- **API1 Broken Object Level Authorization (BOLA):** every endpoint that
  takes an `:id` and touches tenant-scoped data MUST filter by
  `req.tenant.id` (or, for App Owner endpoints that intentionally cross
  tenants, by the aggregate-only rule in `docs/SYSTEM_DESIGN.md` §2.4) —
  never trust an `:id`/body field alone to decide which row to touch.
  Mandatory code-review question for every new endpoint: *"what stops
  tenant A from passing tenant B's id here?"*
- **API2 Broken Authentication:** passwords hashed with bcrypt (cost ≥10,
  already in place); no endpoint accepts a password shorter than 8 chars
  for anything the user sets themselves (signup/reset); reset/email-change
  tokens are random 32-byte values, only their SHA-256 hash is stored, and
  they expire (1h, already implemented) and are single-use (`usedAt`/
  `confirmedAt` check, already implemented) — keep this pattern for every
  future token-based flow.
- **API5 Broken Function Level Authorization (BFLA):** role-gating
  middleware (`requireAppOwner`, `requireTenantAdmin`, and future
  `requireRole(...)` variants) must be the first thing in the route chain
  for any mutating endpoint — never rely on the frontend hiding a button
  (this is the exact "RBAC is decorative" bug already found in
  `docs/AUDIT_FINDINGS.md` §1; it must not be reintroduced in the new
  backend).
- **API4 Unrestricted Resource Consumption:** rate limiting (`express-rate-limit`)
  on every endpoint that sends email or authenticates, plus a sane global
  limiter on `/api/*`; request body size capped (`express.json({ limit:
  "1mb" })` or stricter per-route where appropriate).
- **API8 Security Misconfiguration:** `helmet()` on every service; CORS
  origin is validated against the configured base domain (reflecting
  `*` with credentials is never acceptable — fixed in `server/index.ts`);
  stack traces/raw error objects never returned to the client in
  production (only `err.message` is already minimal — tighten further to
  a generic message in production once an error-code system exists).
- **API3/API6 Improper inventory & sensitive flows:** every new route is
  added to this file's mental checklist before shipping — no "forgotten"
  undocumented endpoint. Sensitive business flows (activation, payment
  verification, admin password reset) always write an `audit_log_entries`
  row (already the pattern in `appOwner.ts`).

## 4. Input Validation & Sanitization (applies to backend AND frontend)

- Every request body is validated with a `zod` schema via
  `server/lib/validate.ts`'s `validateBody()`/`validateParams()` before the
  handler runs — reject with 400 on anything that doesn't match, never
  "best-effort" parse. Strings are trimmed and length-capped in the schema
  itself (schema is the single place sanitization happens).
  Email fields always `.toLowerCase().trim().email()`.
- Never build a SQL string by concatenating user input — Drizzle's query
  builder (parameterized) is the only way data reaches Postgres; this is
  already true everywhere in `server/db/`, keep it true.
- On the frontend, any user-supplied text rendered into the DOM goes
  through React's normal escaping (never `dangerouslySetInnerHTML` with
  unsanitized input) — if a feature genuinely needs rendering HTML a user
  typed (e.g. a document template), sanitize with a library like `dompurify`
  before rendering, never trust it raw.

## 5. Client-Side Security Hardening

- **CSP:** the production build's served `index.html` sets a Content-Security-Policy
  (via hosting platform headers or a `<meta http-equiv="Content-Security-Policy">`)
  restricting `script-src`/`style-src` to self + the exact CDNs actually used;
  this is a deployment-time task once hosting is chosen — tracked here so
  it isn't skipped.
- **Secure cookies:** covered by §2 — the frontend never reads/writes the
  session cookie directly (httpOnly blocks JS access by design; this is
  intentional, not a bug to "fix" by relaxing it).
- **Minification:** the Vite production build (`npm run build`) already
  minifies by default — don't disable it; don't ship `sourcemap: true` to
  production (keep sourcemaps for staging/debug builds only).
- **Input validation on the client:** client-side form validation exists
  for UX (immediate feedback) but is **never** the security boundary —
  every check the frontend does must be re-validated server-side per §4,
  since client-side checks are trivially bypassed.

## Checklist for every new endpoint (copy into the PR/commit description mentally)

- [ ] Body/params validated with a zod schema (§4)
- [ ] Role-gating middleware applied before the handler (§3 BFLA)
- [ ] Tenant/ownership filter applied to the actual query, not just checked
      in a comment (§3 BOLA)
- [ ] Rate-limited if it authenticates, sends email, or is otherwise abusable (§3/§1)
- [ ] Errors can't crash the process (§1) and don't leak internals (§3)
- [ ] Sensitive action writes an audit log row (§3)
