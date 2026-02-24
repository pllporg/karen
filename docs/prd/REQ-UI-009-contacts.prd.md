# REQ-UI-009 PRD - Contacts Graph/List Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /contacts
- Source path: apps/web/app/contacts/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Intake Specialist
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

## Problem Statement

Contacts is a high-frequency operational surface for relationship graphing, tag filtering, and dedupe merges. A route-level PRD is required to keep merge and graph interactions procedurally consistent and auditable.

## User Intent

- Search and filter contacts by identity and tag criteria.
- Inspect relationship graph edges and directionality.
- Resolve dedupe suggestions through explicit confirm/decision workflows.

## Functional Scope

- Contact table/list display with tag filters and search.
- Relationship graph load/filter controls.
- Dedupe suggestion queue with merge/ignore/defer decisions.
- Confirmation flow for merge actions and feedback toasts.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Review-Gate and Approval Behavior

Dedupe merge is an explicit review action. Merge confirmation must be reversible until submit and produce auditable result state.

## Permissions and Visibility

- Internal authenticated membership required.
- Merge and decision actions restricted to staff roles.
- Contact visibility is tenant-scoped.

## Data and Validation Requirements

- Tag include/exclude parsing supports csv input and mode (any/all).
- Merge operations validate pair identity and reject self-merge.
- Graph filter controls validate relationship type and search criteria.

## Audit and Traceability Requirements

- Merge/decision actions must expose actor, pair key, timestamp, and resulting decision.
- Graph and filter state must remain visible in UI context metadata.

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
