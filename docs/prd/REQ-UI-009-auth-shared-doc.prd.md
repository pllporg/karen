# REQ-UI-009 PRD - Login and Shared Document Access Routes

## Metadata

- Requirement ID: REQ-UI-009
- Route(s): /login and /shared-doc/[token]
- Source path: apps/web/app/login/page.tsx, apps/web/app/shared-doc/[token]/page.tsx
- Primary roles: Admin, Attorney, Paralegal, Client, Portal User
- Canonical references:
  - docs/UI_CANONICAL_PRECEDENCE.md
  - docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md
  - brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx

## Problem Statement

Authentication and tokenized shared-document entry points require explicit access-state behavior, error handling, and secure redirect expectations.

## User Intent

- Authenticate by sign-in/register workflows.
- Receive actionable auth errors and loading states.
- Open shared document links through secure token redirect path.

## Functional Scope

- Login/register mode toggle and credential submission.
- Auth error/status rendering.
- Shared-doc token route redirect to secure API endpoint.

## State Model

- Default
- Loading
- Empty
- Error
- Success

## Review-Gate and Approval Behavior

Auth and shared-doc flows do not use artifact review states; however, access to client-facing documents must remain explicitly authorized and traceable.

## Permissions and Visibility

- Auth route is public but enforces credential validation.
- Shared-doc token route allows access only through signed token verification on API.
- Session establishment controls subsequent app-shell route access.

## Data and Validation Requirements

- Email/password required for login and registration.
- Registration requires organization name.
- Invalid or expired token behavior handled by API redirect target responses.

## Audit and Traceability Requirements

- Auth success/failure and shared-doc token access are traceable in backend audit logs.
- UI surfaces clear status messaging for authentication outcomes.

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
