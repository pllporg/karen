# REQ-UI-009 Screen Spec - Documents Operations

## Metadata

- Requirement ID: REQ-UI-009
- Screen ID: DOC-001
- Route(s): /documents
- Linked PRD: docs/prd/REQ-UI-009-documents.prd.md

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
