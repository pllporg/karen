# REQ-UI-009 PRD - Client Portal Route

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /portal
- Source path: apps/web/app/portal/page.tsx
- Primary roles: Client, Attorney, Paralegal, Intake Specialist
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx

## Problem Statement

Portal route contains client-facing messaging, attachments, intake submission, and e-sign actions. A formal spec is required to enforce explicit approval and secure artifact access behavior.

## User Intent

- View matter snapshot/status as portal user.
- Send secure portal messages and attachment uploads.
- Submit intake responses and create/refresh e-sign envelopes.
- Download shared documents securely.

## Functional Scope

- Portal snapshot cards and counts.
- Secure message compose with optional attachment upload.
- Shared document listing/download actions.
- Intake submit and e-sign create/refresh workflow.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Review-Gate and Approval Behavior

Client communications and envelope progression require explicit user action and visible status; no background auto-send transitions are allowed.

## Permissions and Visibility

- Portal user access is scoped to authorized matters and shared artifacts.
- Attachment download requires signed URL issuance.
- Staff-side operations exposed in portal context follow role policy.

## Data and Validation Requirements

- Matter id and payload validated before message/intake/e-sign actions.
- Attachment upload errors surfaced inline and block submit.
- E-sign provider choice must be explicit.

## Audit and Traceability Requirements

- Portal actions record actor, matter, artifact id, and timestamp.
- Envelope status refresh surfaces provider and latest status metadata.

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
