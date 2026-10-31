# Design Rules — NusaHR Enterprise HRMS

Status: UI concept is FINAL. These rules exist to keep new work consistent with
what's already built — not to change the look. See
`docs/UI_UX_DESIGN_GUIDELINES.md` for the full system; this file is the
quick-reference checklist Claude must follow before writing or editing UI.

## Non-negotiable layout rules

1. **Tab/sub-menu placement**: never put tabs next to the page title on the
   same row. Always two separate rows:
   - Row 1: title + description + primary CTA button(s).
   - Row 2: horizontally scrollable tab-pill bar (`overflow-x-auto no-scrollbar`).
2. **Modal dismissal**: every modal must close on backdrop click
   (`onClick` on the outer fixed div checking `e.target === e.currentTarget`)
   and ideally on `Escape`. Inner content div must `stopPropagation`.
3. **Responsive breakpoints**: design for desktop (≥1280px), tablet
   (768–1024px), mobile (<768px). Tables get `overflow-x-auto`. Stat grids:
   `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`.
4. **Palette**: Slate-Indigo enterprise SaaS palette, WCAG 2.1 AA contrast.
   Don't introduce new color families without checking existing module usage
   for precedent first.

## Component conventions to reuse, not reinvent

- Status should always render as a colored badge/pill, never plain text —
  check an existing module (e.g. EmployeeManagement, ApprovalCenter) for the
  badge component/class pattern before adding a new status anywhere.
- Icons: `lucide-react` only, sized `w-5 h-5` in headers, `w-4 h-4` inline.
- Forms: label above input, consistent spacing (`gap-3`/`gap-4`), required
  fields marked, validation errors rendered inline under the field.
- Empty states and loading states must follow whatever pattern the
  surrounding module already uses — don't introduce a new empty-state style
  per module.

## Data-shape rules that affect design (read alongside coding-standards.md)

When adding or editing a form/screen, a field that represents a relationship
to another entity (owner, approver, department, holder, vendor, position)
must be designed as a **picker bound to that entity's real ID** (dropdown
backed by the entity list), not a free-text input — even if today's mock data
makes a text input look "fine". Free-text relationship fields are exactly the
kind of hidden inconsistency flagged in the business-flow audit
(`docs/AUDIT_FINDINGS.md`) and must not be reintroduced.

Every entity that can be "held", "assigned", or "in progress" must have a
visible status affordance in its UI (badge: Available/Assigned/In Repair/
Retired, Open/Closed, Pending/Approved/Rejected, etc.) — never leave the
state implicit in the absence of a value.

## Before changing anything visual

1. Grep for an existing module that already solves the same UI pattern.
2. Copy its markup structure/class names rather than inventing new ones.
3. If the UI concept genuinely needs to change (not just retouch), stop and
   confirm with the user first — the UI concept is explicitly frozen.
