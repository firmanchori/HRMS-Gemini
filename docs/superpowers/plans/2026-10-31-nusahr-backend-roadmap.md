# NusaHR Backend & Business-Flow Remediation Roadmap

> **For agentic workers:** This is a *master sequencing roadmap*, not a single
> ready-to-implement feature plan. Each Phase below is implemented by writing
> a detailed task-by-task plan for that phase alone (using
> superpowers:writing-plans again, scoped to just that phase) once the phase
> is started — specifics like exact table DDL, API route signatures, and
> service function names are decided at that point, not here. When a phase's
> detailed plan exists, execute it with superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans. Phase-level steps below use
> checkbox (`- [ ]`) syntax so the user can track progress phase by phase.

**Goal:** Take NusaHR from a frontend-only mock-data app to a real
multi-tenant SaaS backend, fixing the business-flow defects the audit found,
in an order the product owner can review module-by-module as it ships —
while making sure the two load-bearing systems (Approval Engine, core data
model) are fixed before anything that depends on them.

**Architecture:** Keep the existing React 19 + Tailwind frontend's UI concept
untouched (per `docs/UI_UX_DESIGN_GUIDELINES.md` §4 — "Konsep UI sudah
final"). Build a real Postgres-backed API layer behind it, module by module,
replacing `HrmsContext.tsx`'s in-memory/localStorage state and ad-hoc
business logic with real persistence, a shared Approval Engine, and a shared
Document/Signature Engine — per the target models already written into
`docs/ERD.md` §4 and `docs/SYSTEM_DESIGN.md` §2-3.

**Tech Stack:** React 19 + TypeScript + Vite (existing, unchanged) · Node.js
+ Express (already a dependency) for the API · PostgreSQL via Supabase
(connection already verified working) · Drizzle ORM + drizzle-kit for
migrations (recommended in `.claude/database-rules.md`; confirm with user
before Phase 0 Step 1 if not yet confirmed).

**Spec:** `docs/AUDIT_FINDINGS.md` (the defect checklist every phase below
traces back to), `docs/PRD.md` §1.1 and §3.6-3.8 (target business rules),
`docs/ERD.md` §4 (target schema), `docs/SYSTEM_DESIGN.md` §2-3 (target
architecture/flows), `docs/BUSINESS_FLOW_DIAGRAMS.html` (visual reference).

## Global Constraints

- Every schema change ships with a migration file AND an updated seed file
  AND an `ERD.md` update in the same commit (`.claude/database-rules.md`
  Aturan 3) — no exceptions, including inside a single phase's own tasks.
- Every table/query that holds tenant data filters by `tenant_id`; every
  table that holds entity-scoped data filters by the `entity_closure`
  hierarchy rule, not a flat `entity_id` equality check
  (`docs/SYSTEM_DESIGN.md` §2.1) — this is a per-phase review gate, not a
  one-time task.
- Relationship fields are foreign-key IDs, never free-text strings
  (`.claude/coding-standards.md` Data modeling rule 1).
- No fabricated/random PII is ever written to a real table — a missing
  field is stored as NULL/"incomplete", never invented
  (`docs/AUDIT_FINDINGS.md` §5, Recruitment→Onboarding finding).
- RBAC permission checks are enforced server-side on every mutating
  endpoint, never only hidden in the UI (`docs/AUDIT_FINDINGS.md` §1 RBAC
  finding — this exact gap already exists and must not be repeated in new
  code).
- UI concept/layout is frozen; only data wiring changes
  (`docs/UI_UX_DESIGN_GUIDELINES.md` §4, `.claude/design-rules.md`).
- TypeScript strict, no `any` (`.claude/coding-standards.md`).

## Review Focus

(Highest-risk gaps from the audit that a phase's own tests must specifically exercise, most likely to bite first:)

1. **Cross-tenant/cross-entity data leakage** — any new list/query endpoint
   must be tested with two tenants (and, once entities exist, a sibling
   entity) to prove neither sees the other's rows. This exact bug already
   exists for `businessTrips` (`AUDIT_FINDINGS.md` §4) — its fix is Phase 2,
   but every later phase's endpoints need the same test pattern.
2. **Approval level-skip** — any endpoint that can change a request's
   status must be tested to prove it cannot jump past an intermediate
   approval level (the Loan/SPPD/Reimbursement bypass bug, `AUDIT_FINDINGS.md`
   §1) — owned by Phase 1, re-tested by every phase that creates approval
   requests (5, 7, 8).
3. **Premature QR/document finalization** — Phase 3's tests must prove a
   document's number/QR cannot exist while any required signatory is still
   `Pending`.
4. **Asset status drift** — Phase 9's tests must prove an asset can only be
   held by one employee at a time and can always be returned to `Available`
   (the "can never un-assign" bug, `AUDIT_FINDINGS.md` §3).
5. **RBAC decoration** — Phase 11's tests must prove that disabling a role's
   permission for an action actually blocks the API call, not just hides a
   button (`AUDIT_FINDINGS.md` §1 RBAC finding).

---

## Phase 0: Foundation — Tooling, Tenant/Entity/Subscription Skeleton

**Goal:** Stand up the real database skeleton everything else builds on:
tenants, the entity hierarchy (with closure table), subscription plans, and
the App-Owner/tenant RBAC split. No business modules yet.

**Why first:** every later phase's tables carry `tenant_id` (and, from
Phase 2 onward, entity scoping); nothing else can be migrated/seeded until
this exists.

- [ ] Confirm ORM/migration tool with user (Drizzle recommended — see
      `.claude/database-rules.md`); install it as a real dependency
      (`npm install drizzle-orm pg` + `npm install -D drizzle-kit`).
- [ ] Set up `drizzle.config.ts` pointing at the already-verified Supabase
      `DATABASE_URL`/`DIRECT_URL`.
- [ ] First migration: `tenants`, `company_entities`, `entity_closure`,
      `subscription_plans`, `tenant_subscriptions`, `users` — per
      `docs/ERD.md` §4.4a. Closure-table maintenance (insert self-row +
      copy ancestor rows) implemented as a DB trigger or a service function
      called from `company_entities` insert — decide which in the
      phase-detail plan.
- [ ] First seed: 1 App-Owner "Enterprise" plan with `enabled_modules = ALL`,
      2-3 sample tenants (one single-entity, one multi-entity with a 3-level
      tree) to exercise the closure table immediately.
- [ ] App-Owner-only aggregate endpoint: `GET /app-owner/tenants` returning
      only `{tenantId, name, entityCount, userCount, planName, expiresAt}` —
      **never** entity rows (`docs/SYSTEM_DESIGN.md` §2.4). Test: calling it
      cannot return anything resembling an entity name or parent/child
      relationship.
- [ ] `npm run db:seed` entrypoint wired per `.claude/database-rules.md`
      Aturan 2 (per-module seed files, idempotent, runnable individually).
- [ ] **Subdomain routing (added 2026-10-31):** `tenants.subdomain` (unique)
      set at signup. Server middleware resolves `Host` header → subdomain →
      tenant context for every request; App Owner login/dashboard lives on
      the bare domain (no subdomain), every tenant on `{subdomain}.<domain>`
      (`localhost:3000` in dev — no `/etc/hosts` edit needed, `*.localhost`
      resolves automatically). `vite.config.ts` `server.allowedHosts` set to
      accept the wildcard in dev. Session validated against the subdomain
      it was issued on (a tenant-A session must not work on tenant-B's
      subdomain).
- [ ] **App Owner account-lifecycle module (added 2026-10-31):** tenant list
      with status (`PendingPayment|Active|Suspended|Expired|Cancelled`);
      manual payment-verification action that activates a tenant; view +
      extend `tenant_subscriptions.expires_at`; reset tenant admin password
      (emails a reset link); change tenant admin email (with verification);
      suspend/reactivate; every action writes an `audit_log_entries` row.
- [ ] **Email sending (added 2026-10-31):** `RESEND_API_KEY` lives in
      `.env.local`/production env vars only — never in the DB or frontend.
      An "Email Settings" screen stores only non-secret config (sender
      name, from/reply-to address, template choice); the key itself is
      always read from the environment at send-time.
- [ ] **Contact + Inbox (added 2026-10-31):** public Contact form writes to
      `contact_inquiries` (name, email, subject, message, status
      `New|Replied|Closed`); App Owner Inbox screen lists these and a
      "Reply" action sends via Resend and appends the reply to the same
      thread row.
- [ ] Definition of done: fresh `npm run db:migrate && npm run db:seed`
      against the Supabase instance produces a working tenant/entity tree,
      verified by one query per closure-table visibility rule in
      `docs/ERD.md` §4.4a (ancestor sees descendants, siblings don't see
      each other).

---

## Phase 1: Approval Engine (must precede every module that approves anything)

**Goal:** Replace the hardcoded, bypassable approval logic in
`HrmsContext.tsx` with the real engine from `docs/ERD.md` §4.1 /
`docs/SYSTEM_DESIGN.md` §3.4: configurable flow definitions, org-hierarchy
approver resolution, scoped queues, working SLA/delegation, audited
decisions.

**Why second:** Cuti, SPPD, Pinjaman, Personalia, and Document sign-off
(Phases 5-9) all create approval requests — building them before this phase
would just reproduce the same hardcoded/bypassable pattern the audit found.

- [ ] Migration + seed: `approval_flow_definitions`, `approval_flow_steps`,
      `approval_requests`, `approval_decisions`, `approval_watchers`,
      `approval_delegations` (`docs/ERD.md` §4.1). Seed one real flow
      definition end-to-end (e.g. "Cuti": 2 levels, manager then HR) so
      later phases have something to point `reference_type` at.
- [ ] Approver-resolution service: given a requester + flow definition,
      resolve level-1 approver from `org_structure_nodes.reports_to_id`
      (not a hardcoded role string); check `approval_delegations` for an
      active substitute before falling back to the primary.
- [ ] `POST /approvals/:id/decide` endpoint implementing the level-by-level
      state machine — the single place any module may change a request's
      status. No module-specific endpoint may set `status = 'Approved'`
      directly (closes the bypass bug).
- [ ] SLA job: a scheduled check comparing `due_at` to now, sending a
      reminder and (if configured) escalating per `approval_flow_steps`.
- [ ] Settings UI: admin screen to create/edit `approval_flow_definitions`
      per category (levels, approver role/node, SLA hours, delegation
      on/off) — this is the "pengaturan dulu baru approve" screen the
      product owner asked for.
- [ ] Rewire `ApprovalCenter.tsx` + `MssPortal.tsx` queues to filter by the
      logged-in user's resolved approver assignment (closes the "everyone
      sees everyone's queue" bug), and rewire the "Pengganti Approver" UI
      to actually call the delegation table.
- [ ] Definition of done: a 2-level approval request cannot be finalized by
      a single decide-call (Review Focus #2); a delegated-to substitute
      sees the item in their queue and the original approver does not; an
      SLA-breached item visibly flags for reminder in a test.

---

## Phase 2: Core Org & Employee Data Model Normalization

**Goal:** Fix the free-text relationship fields and org-chart desync the
audit found (`docs/AUDIT_FINDINGS.md` §4) before Personalia, Payroll, or GA
Asset build on top of the wrong model.

**Why third:** Personalia (Phase 5) promoting someone must update the org
chart atomically; Payroll (Phase 7) needs one grade/salary source of truth;
GA Asset (Phase 9) needs a real department/location reference. Fixing this
after those modules exist means re-migrating live data twice.

- [ ] Migration: add `employees.department_id` (FK), `employees.org_node_id`
      (FK), drop `employees.direct_supervisor` in favor of `manager_id`
      only; add entity-scoping (`entity_id` + closure-based filtering) to
      `employees`, consistent with Phase 0's closure table
      (`docs/SYSTEM_DESIGN.md` §2.1 — currently only 4 of ~35 collections
      enforce this).
- [ ] Migration: `grade_salary_ranges` becomes the only salary-band source
      (no parallel hardcoded table — closes the Personalia vs
      GradeSalaryManagement duplicate-table finding).
- [ ] Service: `promoteOrTransferEmployee()` that, in one DB transaction,
      updates the employee row AND flips `org_structure_nodes
      .current_employee_id`/`is_vacant` on both the old and new node
      (closes the org-chart-desync finding) and validates the new salary
      against `grade_salary_ranges`.
- [ ] Backfill migration script for the 3 tenants seeded in Phase 0 to
      populate the new FK columns from the old free-text fields (proves the
      migration path works before any real tenant data exists).
- [ ] Definition of done: a promotion test asserts both the employee row
      and the correct org node flip in the same transaction, and a second
      test asserts a salary above the grade's max is rejected.

---

## Phase 3: Document & Signature Engine

**Goal:** Replace instant QR generation with the real multi-signatory gate
from `docs/ERD.md` §4.2 / `docs/SYSTEM_DESIGN.md` §3.5.

**Why fourth, before Recruitment/Personalia UI work:** Offering letters
(Recruitment), SK Promosi (Personalia), and BAST (GA Asset) all need this
engine; building their UIs against the old instant-QR behavior would mean
re-doing that UI once this phase lands.

- [ ] Migration + seed: `document_signatories`, `document_audit_events`;
      add `official_documents.approval_request_id` (nullable FK to Phase 1)
      and the `Draft | MenungguTtd | RESMI_DITERBITKAN | Dicabut |
      Digantikan` status enum (`docs/ERD.md` §4.2).
- [ ] Service: document creation inserts `Pending` signatory rows for
      maker + required approvers + watchers; `document_number` and
      `qr_verification_url` columns stay NULL until a service function
      confirms every signatory row is `Confirmed`.
- [ ] Real SHA-256 hash of the final rendered document content feeding the
      QR payload (replacing the current `Math.random()`).
- [ ] `document_audit_events` row written on every create/view/confirm/
      reject/QR-generated transition (closes the "no audit trail on
      document issuance" finding).
- [ ] Rewire `DocumentManagement.tsx`'s preview/print modal to only render
      `showQrSignature=true` when the service reports fully-confirmed.
- [ ] Definition of done: a document with one unconfirmed watcher has a
      NULL `qr_verification_url` in a test; confirming the last required
      party flips it in the same test run (Review Focus #3).

---

## Phase 4: Recruitment → Onboarding

**Goal:** First *business module* to go live, now that its two
dependencies (Approval Engine, Document Engine) exist. Fixes the fabricated
PII and dual NIK-numbering bugs.

- [ ] Migration + seed: `job_vacancies`, `candidates`, `onboarding_processes`
      per existing `docs/ERD.md` §2 tables, adjusted to the Phase 2 FK
      columns (department_id, not free text).
- [ ] Single NIK-generation service shared by both the manual "Add
      Employee" path and the onboarding-completion path (closes the
      dual-numbering-rule finding) — no separate hardcoded NIK logic in the
      onboarding completion function.
- [ ] Onboarding-completion service never writes random `birthDate`,
      `nikKtp`, `npwp`, `bpjs*`, or bank account values; missing fields are
      left NULL with the employee record flagged `Perlu Dilengkapi HR`
      (closes the fabricated-PII finding, Global Constraint item 4).
- [ ] Offering-letter generation calls the Phase 3 Document Engine (SK/
      offering letter is `MenungguTtd` until the candidate's acceptance
      response AND internal approver have both confirmed — closes the
      "QR shown even when candidate hasn't responded" finding).
- [ ] Definition of done: completing onboarding with incomplete source data
      produces an employee record with NULL (not random) fields and a
      flag the UI can display; the offering letter's QR is absent until
      the candidate-response + approver-confirm test steps both run.

---

## Phase 5: Employee Master & Personalia

**Goal:** Wire Personalia's promotion/demotion/mutation UI to the Phase 2
transactional service and Phase 1 approval engine.

- [ ] `PersonaliaManagement.tsx` promotion/demotion/mutation form submits
      through `promoteOrTransferEmployee()` (Phase 2) gated by an
      `approval_requests` row (Phase 1, category "Personalia") instead of
      updating the employee row directly.
- [ ] Remove the free-text `__custom__` position option; position picker
      is backed by `org_structure_nodes` only (closes that finding).
- [ ] SK Promosi issuance goes through the Phase 3 Document Engine.
- [ ] Definition of done: approving a Personalia request in the Approval
      Center is what actually triggers the employee+org-node transaction —
      a test asserts nothing changes before the final approval level.

---

## Phase 6: Attendance, Shift, Leave/Cuti

**Goal:** Real leave ledger and org-hierarchy-routed approval for the
canonical "Cuti" example from the product brief.

- [ ] Migration + seed: `leave_requests` (add `attachment_url`, matching
      `AttendanceCorrectionRequest`'s existing field, and a `Dibatalkan`
      status), `leave_ledger_entries` for both buckets (`docs/ERD.md`
      §4.4 — replaces the direct, untracked decrement of
      `remaining_leave_days` and the render-time-only "cuti bersama" math).
- [ ] Leave submission creates an `approval_requests` row (Phase 1,
      category "Cuti") instead of a hardcoded `assignedApproverRole`.
- [ ] Approval of a leave request writes a `leave_ledger_entries` row (not
      a direct balance mutation) and creates the `AttendanceRecord`.
- [ ] `EmployeeManagement.tsx` employee profile now displays the balance
      computed from `leave_ledger_entries`, consistent with ESS.
- [ ] Definition of done: the exact flow in
      `docs/BUSINESS_FLOW_DIAGRAMS.html` §6 (submit → approver-absent →
      substitute → SLA → approve → ledger entry) passes end-to-end in a
      test.

---

## Phase 7: SPPD (Business Trips)

**Goal:** Fix the two-stage approval attribution and the discarded
actual-cost settlement.

- [ ] Migration: `business_trips` gains `actual_cost`, `receipt_urls[]`,
      and per-stage approver/timestamp columns (replacing the single
      `approvedBy` string) — settlement data is now persisted
      (`AUDIT_FINDINGS.md` §4 SPPD finding).
- [ ] Trip submission and each stage transition go through the Phase 1
      engine (category "SPPD", 2 levels: Atasan, Finance) — no local
      "approve" button finalizes a trip directly.
- [ ] Settlement endpoint writes `actual_cost` to the trip row and creates
      a `ReimbursementClaim` only when `actual_cost > estimated_cost`.
- [ ] Definition of done: a trip's realized cost is queryable after
      settlement in a test; a single-stage approve call cannot finalize a
      trip created with `totalLevels: 2` (Review Focus #2).

---

## Phase 8: Payroll & Loan (Kasbon)

**Goal:** Fix the loan/payroll level-skip and the unscoped installment
decrement; add the scheme back-reference and payment ledger.

- [ ] Migration: `employee_loans.loan_scheme_id` (FK, NOT NULL),
      `loan_installments` ledger table (replacing the single mutable
      `remaining_amount` snapshot).
- [ ] Loan approval routes through Phase 1 (category "Pinjaman", 2 levels:
      manager, payroll_admin) — `LoanManagement.tsx`'s local "approve"
      button is removed in favor of the Approval Center/MSS flow.
- [ ] `generatePayrollRun`/`disbursePayrollRun` equivalents scope the loan
      installment decrement to only the employees actually included in
      that specific payroll period (closes the global-side-effect finding)
      and write one `loan_installments` row per deduction instead of
      mutating `remaining_amount` directly.
- [ ] Definition of done: a loan's installment history is a queryable
      ledger; disbursing one period's payroll run does not decrement a
      loan belonging to an employee excluded from that run.

---

## Phase 9: GA Asset & Procurement

**Goal:** Implement the exact flow from the product owner's own example —
asset lifecycle dates, true availability status, Procurement→Asset
linkage, bidirectional holder visibility.

- [ ] Migration + seed: `assets` gains `warranty_expiry_date`, a required
      (not optional) single-source-of-truth `status` enum
      (`Available|Assigned|InRepair|Retired`), `office_location_id` (FK,
      replacing free-text building/room), `procurement_order_id` (FK);
      `asset_handovers` table replacing the component-local
      `BastHandoverRecord` + its `localStorage` key (`docs/ERD.md` §4.3).
- [ ] Procurement "Barang Diterima" status transition calls an
      `createAssetFromProcurement()` service that creates the asset row
      with vendor/price/warranty carried over — no manual re-entry.
- [ ] Handover service: assigning an asset writes an `asset_handovers` row
      AND flips `assets.status`/`assigned_to_employee_id` atomically;
      returning does the inverse and is now possible (closes the
      "can never return to Available" finding, Review Focus #4); swap
      validates both sides non-empty before either side's assignment
      changes.
- [ ] Employee profile shows "Aset yang Dipegang" from a reverse query on
      `asset_handovers` (closes the no-reverse-link finding).
- [ ] Offboarding checklist replaces `assetReturned: boolean` with a
      per-asset checklist driven by that employee's open
      `asset_handovers` rows.
- [ ] Definition of done: a full purchase→assign→return cycle is a passing
      test, including the asset count returning to a queryable "Available"
      state (Review Focus #4) and the employee-side holdings view updating.

---

## Phase 10: Performance/KPI, Compliance, Audit Trail

**Goal:** Wire evaluator-authority checks and close the missing
audit-logging gaps.

- [ ] KPI evaluation endpoint checks the evaluator is the subject's actual
      `manager_id` chain (via `org_structure_nodes`), not an unchecked
      dropdown.
- [ ] `issueComplianceAction` (SP/Skorsing/PHK) and `executeMigrationImport`
      (bulk employee import) both write `audit_log_entries` rows — closes
      the two unlogged-sensitive-action findings.
- [ ] Remove/flag the `AuditTrailManagement.tsx` "Simulasi" feature so
      simulated entries are visually distinct from real ones (closes the
      indistinguishable-fake-entries finding).
- [ ] Definition of done: a disciplinary action and a migration import each
      produce a real audit row in a test; an evaluator outside the
      reporting chain is rejected by the KPI endpoint.

---

## Phase 11: RBAC Enforcement & Multi-Entity Visibility Sweep

**Goal:** Close the "RBAC matrix is decorative" finding across every
endpoint built in Phases 1-10, and apply the Phase 0 entity-closure
visibility rule everywhere it was skipped.

- [ ] Middleware: every mutating endpoint checks the caller's role
      permission for that module/action against the RBAC tables before
      executing — audited module by module against the list built in
      Phases 1-10 (not just ApprovalCenter, which the audit singled out).
- [ ] Sweep every list endpoint built so far for entity-closure scoping
      (Global Constraint #2) — this phase is explicitly the net that
      catches anything an earlier phase missed under time pressure.
- [ ] Definition of done: toggling a role's permission off in RBAC and
      calling that endpoint directly (not through the UI) returns 403 in a
      test, for at least one endpoint per module built in Phases 1-10
      (Review Focus #5).

---

## Phase 12: Reports/Dashboard Cutover & Legacy Cleanup

**Goal:** Point `ReportsManagement.tsx`/`DashboardOverview.tsx` at the real
API instead of `HrmsContext`'s mock state, and remove the now-dead
localStorage silos.

- [ ] Reports/Dashboard queries read from the Phase 0-11 tables directly
      (already reading "live state" conceptually — this phase swaps the
      state source, not the logic).
- [ ] Remove the module-local `localStorage` silos identified in the audit
      (GA BAST, Loan schemes) now that Phases 8-9 replaced them with real
      tables; remove the now-redundant `resetToSampleFlowData` function
      (no longer meaningful once there's a real database to reset via
      migration/seed re-run instead).
- [ ] Definition of done: `HrmsContext.tsx` no longer contains the business
      logic migrated in Phases 1-10 — it becomes a thin API client, and a
      fresh `npm run db:migrate && npm run db:seed` is the only way to get
      a clean demo state (replacing the old reset button).

---

## Self-Review Notes

- **Spec coverage:** every numbered finding in `docs/AUDIT_FINDINGS.md`
  §1-§6 maps to an explicit bullet above (Approval §1 → Phase 1; Document
  §2 → Phase 3; GA Asset §3 → Phase 9; Data model §4 → Phases 2/5/6/7/8;
  Recruitment/KPI/Compliance §5 → Phases 4/10; State/persistence §6 →
  Phase 12).
- **Ordering rationale for the user's "ikuti flow aplikasi" request:**
  Phases 4-10 follow the natural business flow (Recruitment → Onboarding →
  Employee/Personalia → Attendance/Leave → SPPD → Payroll/Loan → GA Asset
  → KPI/Compliance) exactly as asked; Phases 0-3 come first only because
  Phases 4+ would otherwise be built against the same broken
  approval/data-model/document foundation the audit flagged, requiring
  rework.
- **Proportion:** this roadmap intentionally stays at phase/module
  granularity, not per-file TDD steps, because the full backend spans ~12
  modules whose exact schemas/endpoints aren't decided yet (framework and
  ORM confirmation is Phase 0's first step). Each phase gets its own
  detailed writing-plans-format plan immediately before it starts.
