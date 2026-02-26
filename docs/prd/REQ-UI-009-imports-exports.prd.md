# REQ-UI-009 PRD - Import and Export Routes

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /imports and /exports
- Source path: apps/web/app/imports/page.tsx, apps/web/app/exports/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Billing/Accounting
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

- Backlog Reference: `REQ-UI-PRD-010` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Problem Statement

Portability workflows must remain deterministic and transparent. Import and export routes need explicit behavior specs for batch status, file input constraints, and artifact generation feedback.

## User Intent

- Run source-specific imports and inspect recent batch outcomes.
- Generate full backup exports and retrieve package artifacts.
- Verify portability job statuses quickly.

## Functional Scope

- Import source/system selection plus optional entity type mapping.
- Import file upload and batch result rendering.
- Recent import batch table.
- Full backup generation action and export jobs table.

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

Import/export execution requires explicit user submission; no hidden auto-run behavior.

## Permissions and Visibility

- Only authorized internal roles can run import/export jobs.
- Job history visibility remains tenant-scoped.
- Download links follow signed-url constraints.

## Data and Validation Requirements

- Import run requires selected file and supported source system.
- Generic CSV requires explicit entity type.
- Export generation reports job id and status before download action.

## Audit and Traceability Requirements

- Each import/export run surfaces job/batch identifiers and status timestamps.
- User-visible result payloads include warning/error summaries for traceability.

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
