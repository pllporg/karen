# REQ-UI-009 Screen Spec - Reporting and Admin Operations

## Metadata

- Requirement ID: REQ-UI-009
- Screen ID: ADM-001
- Route(s): /reporting and /admin
- Linked PRD: docs/prd/REQ-UI-009-reporting-admin.prd.md

## Layout Structure

- Top bar with route identity and procedural subtitle
- Primary operational region (table/list-first for dense data)
- Secondary region for notices, status metadata, and low-frequency actions

## Components Used

- Primitives: Button, Input, Select, Badge, Table, Card, Drawer, Modal, Toast
- Route-specific composition follows existing implementation patterns in apps/web/app/reporting/page.tsx, apps/web/app/admin/page.tsx

## States

- Default
- Loading
- Empty
- Error
- Success

## Actions

- Export report CSV.
- Create config entities.
- Run/resolve conflict checks.
- Filter/retry webhook deliveries.

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
