# REQ-UI-009 PRD - Communications Hub Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /communications
- Source path: apps/web/app/communications/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Intake Specialist, Client (portal scoped)
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

- Backlog Reference: `REQ-UI-PRD-005` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Problem Statement

Communications needs formal state and interaction rules for thread selection, manual log entry, and keyword search outcomes so message workflows remain deterministic and review-safe.

## User Intent

- Create and select communication threads.
- Log call/email/text notes against active thread.
- Search communications by keyword and inspect result snippets.

## Functional Scope

- Thread list and active thread selection controls.
- Manual message logging form.
- Keyword search input and results panel.
- Status feedback for active thread and result counts.

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

Client-facing send operations are not auto-executed from passive interactions; explicit submit actions are required for message logging and future external-send surfaces.

## Permissions and Visibility

- Internal users can create threads and messages based on role policy.
- Search results must respect matter/contact authorization boundaries.
- Portal user communications remain scoped to portal workflows.

## Data and Validation Requirements

- Thread id is required for message logging.
- Search query empty state clears results safely.
- Message payload includes typed communication metadata.

## Audit and Traceability Requirements

- Message create actions expose actor, thread, timestamp.
- Search interactions preserve query context and result count metadata.

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
