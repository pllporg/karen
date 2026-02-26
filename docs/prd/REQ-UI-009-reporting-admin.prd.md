# REQ-UI-009 PRD - Reporting and Admin Routes

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /reporting and /admin
- Source path: apps/web/app/reporting/page.tsx, apps/web/app/admin/page.tsx
- Primary roles: Admin, Attorney, Billing/Accounting, Operations
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

- Backlog Reference: `REQ-UI-PRD-011` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Problem Statement

Reporting and admin surfaces provide governance controls and audit visibility. They need route specs to ensure permissioned actions, conflict workflows, and webhook operations remain explicit and auditable.

## User Intent

- Review operational reports and export CSV outputs.
- Manage config entities (custom fields, sections, participant roles).
- Run and resolve conflict checks.
- Monitor and retry webhook deliveries.

## Functional Scope

- Reporting tables/cards and CSV links.
- Admin configuration actions and listing tables.
- Conflict profile/check workflows and resolution actions.
- Webhook endpoint/delivery monitor and retry actions.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Interaction Model

- Primary interactions follow explicit user actions (no silent state mutation).
- Mutating actions require deterministic feedback with success/error outcomes.
- Navigation handoffs preserve route context for downstream audit surfaces.

## Review-Gate and Approval Behavior

Conflict resolution and retry operations are high-impact actions and must require explicit operator intent with visible status transitions.

## Permissions and Visibility

- Reporting access follows role-specific data scopes.
- Admin actions restricted to privileged roles.
- Webhook retries limited to authorized governance operators.

## Data and Validation Requirements

- Config create/update payloads validate required keys/labels.
- Conflict checks require query text and optional profile selection.
- Webhook filters and retry actions validate target delivery state.

## Audit and Traceability Requirements

- Admin actions expose actor, action, and timestamp in audit viewer context.
- Conflict resolution and webhook retry outcomes are timestamped and status-linked.

## Accessibility Requirements

- Keyboard traversal in visual reading order
- Focus-visible on every interactive control
- Field labels and error messaging remain explicit
- Dialog and drawer focus trap plus return behavior when overlays are used

## Responsive Requirements

- >=1280px: full desktop shell and dense table-first layout
- 1024-1279px: compact desktop shell preserving action visibility
- 768-1023px: tablet shell with drawer navigation and single-column stacking as needed
- <768px: unsupported operator workflow notice

## Acceptance Criteria

- Route behavior documented with explicit states and action model
- Permissions, validation, and audit expectations are testable
- Screen spec is linked and versioned for implementation handoff
