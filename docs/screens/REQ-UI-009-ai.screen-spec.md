# REQ-UI-009 Screen Spec - AI Workspace

## Metadata

- Requirement ID: REQ-UI-009
- Screen ID: AI-001
- Route(s): /ai
- Linked PRD: docs/prd/REQ-UI-009-ai.prd.md

## Layout Structure

- Top bar with route identity and procedural subtitle
- Primary operational region (table/list-first for dense data)
- Secondary region for notices, status metadata, and low-frequency actions

## Components Used

- Primitives: Button, Input, Select, Badge, Table, Card, Drawer, Modal, Toast
- Route-specific composition follows existing implementation patterns in apps/web/app/ai/page.tsx

## States

- Default
- Loading
- Empty
- Error
- Success

## Actions

- Create AI job.
- Create/edit style pack.
- Attach/remove style source doc.
- Approve artifact.
- Confirm deadlines.

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
