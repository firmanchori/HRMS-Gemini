# Testing Standards — NusaHR Enterprise HRMS

Status: Vitest is installed (`npm run test` / `npm run test:watch`). Backend
pure-function business logic (`server/lib/pricing.test.ts`,
`server/lib/proration.test.ts`) is covered as of the App Owner billing work.
Component/E2E coverage for the tenant-side app below is still pending.

## Required stack (install when the first test is written, not before)

- **Unit / component**: Vitest + @testing-library/react + @testing-library/
  jest-dom. Matches Vite tooling already in use; no extra bundler config.
- **E2E / flow**: Playwright, for the multi-step flows that matter most
  (approval chain, document signing → QR, asset handover/return, onboarding
  pipeline). Don't reach for Playwright for simple CRUD forms — unit/component
  tests cover those.
- **Type safety as a test gate**: `npm run lint` (`tsc --noEmit`) must pass
  with zero errors before any PR is considered done — this repo currently
  uses TypeScript as its first line of defense and that must not regress.

## What must have a test before being called "done" (post-backend)

1. **Business calculation engines** (PPh 21 TER, BPJS, leave balance
   deduction, overtime 1.5x/2x, loan installment math, document numbering
   formula) — pure-function unit tests with real regulatory examples as
   fixtures, not arbitrary numbers.
2. **Approval workflow logic** (level routing, delegate/substitute approver,
   SLA timeout/escalation, final-status resolution) — test every branch:
   approve, reject, delegate, SLA breach, missing approver.
3. **Document signature/QR gating** — explicit test that the QR is NOT
   generated/shown until every required signer (preparer, approvers, "mengetahui"
   parties) has confirmed; test the partially-confirmed state renders
   correctly and blocks QR.
4. **Cross-entity state consistency** (asset handover flips both the asset's
   status and the employee's held-assets list atomically; leave approval
   decrements the correct leave bucket; contract/probation date triggers) —
   these are exactly the flows the business-flow audit found weakly wired,
   so they get regression tests first.
5. **Multi-tenant isolation** — any new query/action must have a test
   asserting it is scoped by `tenantId`/`entityId` and cannot leak across
   tenants.

## What does not need dedicated tests

- Pure presentational components with no logic branches.
- Tailwind class/layout changes (visual, not logical — verify by running the
  dev server and looking, per project-wide UI testing guidance).
- One-off settings screens with simple form-to-state binding and no
  calculation or cross-entity effect.

## Process rules

- Follow TDD for new business logic once the backend lands: write the
  failing test against the intended contract before writing the
  implementation (see `superpowers:test-driven-development`).
- A bug fix in calculation/workflow logic must come with a regression test
  reproducing the bug, not just a manual check.
- Do not mock the database/API in integration tests for approval or
  signature flows — these are exactly the flows where a mock/real divergence
  would hide a broken migration or RLS policy; use a real (test) database.
- When backend work starts, API contract tests (request/response shape) are
  required for every endpoint before the frontend is wired to it — this
  repo has a history of frontend-only forms that silently didn't match any
  real data model; don't repeat that at the API boundary.
