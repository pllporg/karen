# REQ-UI-009 PRD - Billing and Trust Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /billing
- Source path: apps/web/app/billing/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Billing/Accounting
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

- Backlog Reference: `REQ-UI-PRD-007` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Problem Statement

Billing route spans invoices, trust ledger, reconciliation, and LEDES export workflows. It needs one procedural specification for status transitions, discrepancy resolution, and export controls.

## User Intent

- Create invoices and inspect balance state.
- Review trust ledger balances.
- Run trust reconciliation and resolve discrepancies.
- Configure LEDES profile and run/export jobs.

## Functional Scope

- Invoice creation and table listing.
- Trust ledger summary table.
- Reconciliation run create/submit/resolve/complete flow.
- LEDES profile creation and export job lifecycle.

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

Reconciliation completion and LEDES export are explicit operations with visible status and validation outcomes before download.

## Permissions and Visibility

- Billing-sensitive actions limited to billing-authorized internal roles.
- Trust and export data are tenant and matter scoped.
- Role restrictions apply to reconciliation completion and export download.

## Data and Validation Requirements

- Reconciliation period inputs validated before run creation.
- Discrepancy resolution requires explicit status and note.
- LEDES job validates profile and invoice set before completion.

## Audit and Traceability Requirements

- Run status changes, discrepancy resolutions, and export job actions include actor/timestamp context.
- Download URL issuance is traceable to job id and status.

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
