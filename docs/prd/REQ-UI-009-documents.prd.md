# REQ-UI-009 PRD - Documents Operations Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /documents
- Source path: apps/web/app/documents/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Billing, Client (shared doc read-only)
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

## Problem Statement

The documents route combines upload, generation, retention, legal hold, and disposition workflows. Formal PRD coverage is needed to ensure explicit confirmations and auditability in retention/disposition actions.

## User Intent

- Upload and generate documents tied to matters.
- Assign retention policies and legal holds.
- Create, approve, and execute disposition runs.
- Review document inventory and status.

## Functional Scope

- Document upload and generated PDF actions.
- Retention policy create/assign lifecycle.
- Legal hold place/release actions.
- Disposition run create/approve/execute workflow.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Review-Gate and Approval Behavior

Disposition execution and any client-sharing action must be explicit and confirmed. No automatic destructive transitions are allowed.

## Permissions and Visibility

- Upload and policy/hold/disposition actions require internal role authorization.
- Client-visible docs must respect sharedWithClient and signed-link controls.
- All actions remain organization and matter scoped.

## Data and Validation Requirements

- Uploads require file and matter association.
- Retention policy requires scope/trigger/retention days.
- Disposition execution blocks held or ineligible documents and reports outcome.

## Audit and Traceability Requirements

- Retention, hold, and disposition actions capture actor, reason/notes, timestamp, and affected document ids.
- Document version operations expose version identifiers and status.

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
