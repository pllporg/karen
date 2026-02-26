# REQ-UI-009 Screen Spec - Documents Operations

## Metadata

- Requirement ID: REQ-UI-009
- Screen ID: DOC-001
- Route(s): /documents
- Linked PRD: docs/prd/REQ-UI-009-documents.prd.md

- Backlog Reference: `REQ-UI-PRD-006` (`docs/UI_PRD_SCREEN_BACKLOG.md`), `KAR-71`

## Layout Structure

- Top bar with route identity and procedural subtitle
- Primary operational region (table/list-first for dense data)
- Secondary region for notices, status metadata, and low-frequency actions

## Components Used

- Primitives: Button, Input, Select, Badge, Table, Card, Drawer, Modal, Toast
- Route-specific composition follows existing implementation patterns in apps/web/app/documents/page.tsx

## States

- Default
- Loading
- Empty
- Error
- Success

## Actions

- Upload document.
- Generate PDF.
- Create/assign retention policy.
- Place/release hold.
- Create/approve/execute disposition run.

## Review-Gate and Status Presentation

- Status labels are explicit and textual, not color-only
- External/client-impact actions require explicit confirmation
- Timestamped feedback is shown for completed state-changing actions

## Audit Visibility

- Show actor/action/time context wherever workflow payload supports it
- Keep IDs and status metadata visible in mono audit style

## Accessibility

- Full keyboard operability for controls and row actions
- Focus ring visible on all interactive elements
- Errors are written as problem plus corrective action

## Responsive Rules

- Preserve section order and action discoverability across breakpoints
- Maintain table readability with controlled overflow where needed
- Respect unsupported mode behavior under <768px

## Interaction Model

- Primary path: view route summary -> select scoped action -> confirm resulting state feedback.
- Non-destructive interactions (filters, tabs, sorting, search) update visible context without hidden side effects.
- Mutating actions require explicit user intent and inline confirmation/error messaging.


## Role Visibility

- Route visibility follows LIC role policy defined in the linked PRD.
- Role-restricted controls are hidden or disabled with explicit rationale where disclosure is permitted.
- Client portal visibility remains scoped to portal-authorized route behavior only.


## Review-Gate Expectations

- Review-gated actions surface current status labels and required next-step actions.
- No implied approval: status changes require explicit user action.
- Route surfaces expose review-state context needed by downstream audit trails.


## Accessibility Checks

- Verify keyboard-only completion for all primary actions.
- Verify focus-visible treatment on every actionable element.
- Verify status/error messaging is announced with semantic text, not color-only cues.


## Traceability

- Requirement: `REQ-UI-009`.
- Linear issue: `KAR-71`.
- Backlog row: `REQ-UI-PRD-006` in `docs/UI_PRD_SCREEN_BACKLOG.md`.

