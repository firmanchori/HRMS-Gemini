# Coding Standards — NusaHR Enterprise HRMS

Stack: React 19 + TypeScript + Vite + Tailwind v4, single global state via
`src/context/HrmsContext.tsx`, no backend yet (frontend is ahead of the API/DB).
These rules exist to stop the specific class of bug the business-flow audit
(`docs/AUDIT_FINDINGS.md`) found repeatedly: forms that look complete in
isolation but aren't actually wired to the data they depend on.

## Data modeling rules (apply to `src/types/hrms.ts` and any new type)

1. **Relationships are IDs, not strings.** If an entity refers to another
   entity (employee, approver, department/org node, vendor, position,
   grade), the field must be a `*Id` referencing that entity's primary key.
   A denormalized display string (`departmentName`) may exist *alongside*
   the ID for convenience, never instead of it.
2. **Every "assignable/holdable" entity needs an explicit status field**
   with a complete enum (e.g. Asset: `Available | Assigned | InRepair |
   Retired`; Document: `Draft | PendingApproval | Approved | Rejected |
   Published`). Never infer state from "field X happens to be empty."
3. **Every entity with a real-world lifecycle needs its lifecycle dates**
   explicit in the type: purchase/arrival date + warranty expiry for
   assets, contract end date for employees, probation end date, SLA due
   date for approvals, etc. Don't add a feature that implies a date and
   then skip modeling it.
4. **Bidirectional relationships must be queryable from both sides.** If an
   asset has a `currentHolderId`, the reverse lookup ("what does employee X
   currently hold") must be derivable (either a selector/helper in context,
   or a mirrored list) — don't leave it as a one-way pointer nobody reads.
5. **State transitions that affect two entities must be atomic in the
   reducer/action**, not two separate dispatches the caller might forget to
   pair (e.g. asset handover return: old holder cleared AND asset status
   flipped to Available in the same action).

## State management rules (`HrmsContext.tsx`)

- All cross-module data lives in `HrmsContext`. Don't introduce local
  `useState` for anything another module might need to read (that's how
  disconnected islands happen). Local state is fine only for pure UI state
  (open/closed modal, active tab, form draft before submit).
- One generic approval/workflow action, not one bespoke `approveX` per
  module. New request types (leave, SPPD, loan, document) should route
  through the same approval primitive so SLA/delegation/escalation logic
  isn't duplicated and allowed to drift between modules.
- Every CRUD action must filter/stamp `tenantId` (and `entityId` where
  applicable) — copy the pattern from an existing action, don't write a new
  unscoped one.
- Prefer deriving values (leave balance, "who holds this asset", "is this
  contract expiring soon") from source data via a selector, over storing a
  second copy of the same fact that can drift out of sync.

## General TypeScript/React conventions

- Strict typing: no `any`; if a type is genuinely unknown at this stage,
  use a named placeholder type and leave a one-line comment on the business
  reason, not a silent `any`.
- Functional components, hooks only (no class components).
- Keep business calculation logic (tax, BPJS, overtime, numbering formulas)
  in pure functions outside component files — testable in isolation per
  `testing-standards.md`.
- Naming: PascalCase components/types, camelCase variables/functions,
  `useX` for hooks, `*Id` suffix for foreign-key-shaped fields (never
  `*_id` snake_case in TS — snake_case is for the DB layer only, see
  `docs/ERD.md`).
- No dead/commented-out code left in place; delete it (git has the history).
- Comments explain *why*, not *what* — skip comments that restate the code.

## Before adding a new form/field

Ask: "Does this field represent a relationship, a status, or a date the
business actually needs downstream (reporting, approval, compliance)?" If
yes, model it per the rules above now — retrofitting it later (once a real
DB/API exists) is far more expensive than getting the type right while the
app is still frontend-only mock data.
