# REQ-UI-009 PRD - AI Workspace Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /ai
- Source path: apps/web/app/ai/page.tsx
- Primary roles: Admin, Attorney, Paralegal
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - lic-design-system/references/ui-kit.md

## Problem Statement

AI workspace is a command surface for job execution, style-pack governance, and deadline confirmation. It requires explicit review-gate and provenance presentation standards at route level.

## User Intent

- Create AI jobs by tool and matter context.
- Manage style packs and source docs.
- Review artifacts, approve outputs, and confirm extracted deadlines.
- Inspect citation/excerpt evidence and review states.

## Functional Scope

- AI job creation and list rendering.
- Style pack create/update/attach/remove controls.
- Artifact approval workflow.
- Deadline candidate selection and confirm action.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Review-Gate and Approval Behavior

Mandatory review sequence applies: PROPOSED to IN REVIEW to APPROVED to EXECUTED to RETURNED. Deadline extraction requires per-row explicit confirmation before record creation.

## Permissions and Visibility

- AI actions limited to authorized internal users with matter access.
- Style-pack admin operations restricted to privileged roles.
- Artifact confirmation actions require matter-scoped access checks.

## Data and Validation Requirements

- Job create requires matter id and tool.
- Style pack source attach requires valid document version id.
- Deadline confirmation requires at least one selected row and at least one output type per row.

## Audit and Traceability Requirements

- Artifact approvals and deadline confirmations expose actor, artifact id, selection summary, and timestamp.
- Style-pack operations log source document lineage changes.

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
