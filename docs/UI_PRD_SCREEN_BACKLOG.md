# UI PRD + Screen Backlog

This backlog satisfies the LIC adoption requirement to track redesign work for both existing flows and backlog functionality, including blocked placeholders when final PRDs/screens are not yet available.

## Existing Route Coverage (Complete for Current Product Scope)

| Requirement ID | Route/Flow | PRD Status | Screen Spec Status | Notes |
| --- | --- | --- | --- | --- |
| REQ-UI-PRD-001 | `dashboard` shell and queue surfaces | Complete (`docs/prd/REQ-UI-009-dashboard.prd.md`) | Complete (`docs/screens/REQ-UI-009-dashboard.screen-spec.md`) | Define operator landing states and audit summary blocks. |
| REQ-UI-PRD-002 | `matters` list and filters | Complete (`docs/prd/REQ-UI-009-matters-list.prd.md`) | Complete (`docs/screens/REQ-UI-009-matters-list.screen-spec.md`) | Table-first density, sorting, status semantics. |
| REQ-UI-PRD-003 | `matters/[id]` workspace | Complete (`docs/prd/REQ-UI-009-matter-workspace.prd.md`) | Complete (`docs/screens/REQ-UI-009-matter-workspace.screen-spec.md`) | Participants/tasks/calendar/comms/docs/billing tabs + review actions. |
| REQ-UI-PRD-004 | `contacts` graph/list | Complete (`docs/prd/REQ-UI-009-contacts.prd.md`) | Complete (`docs/screens/REQ-UI-009-contacts.screen-spec.md`) | Search/filter/relationship workflow and merge visibility. |
| REQ-UI-PRD-005 | `communications` hub | Complete (`docs/prd/REQ-UI-009-communications.prd.md`) | Complete (`docs/screens/REQ-UI-009-communications.screen-spec.md`) | Thread/message states and delivery log visibility. |
| REQ-UI-PRD-006 | `documents` operations | Complete (`docs/prd/REQ-UI-009-documents.prd.md`) | Complete (`docs/screens/REQ-UI-009-documents.screen-spec.md`) | Upload/version/share/review gates and retention actions. |
| REQ-UI-PRD-007 | `billing` and trust surfaces | Complete (`docs/prd/REQ-UI-009-billing.prd.md`) | Complete (`docs/screens/REQ-UI-009-billing.screen-spec.md`) | Ledger/report/export/reconciliation states and warnings. |
| REQ-UI-PRD-008 | `portal` workflows | Complete (`docs/prd/REQ-UI-009-portal.prd.md`) | Complete (`docs/screens/REQ-UI-009-portal.screen-spec.md`) | Client-facing approval and secure message attachment behavior. |
| REQ-UI-PRD-009 | `ai` workspace | Complete (`docs/prd/REQ-UI-009-ai.prd.md`) | Complete (`docs/screens/REQ-UI-009-ai.screen-spec.md`) | Command-surface behavior, provenance, and review-gate enforcement. |
| REQ-UI-PRD-010 | `imports` + `exports` | Complete (`docs/prd/REQ-UI-009-imports-exports.prd.md`) | Complete (`docs/screens/REQ-UI-009-imports-exports.screen-spec.md`) | Batch progress, conflict resolution, and portability controls. |
| REQ-UI-PRD-011 | `reporting` + `admin` | Complete (`docs/prd/REQ-UI-009-reporting-admin.prd.md`) | Complete (`docs/screens/REQ-UI-009-reporting-admin.screen-spec.md`) | Governance settings, audit views, and permissions UX. |
| REQ-UI-PRD-012 | `login` + `shared-doc/[token]` | Complete (`docs/prd/REQ-UI-009-auth-shared-doc.prd.md`) | Complete (`docs/screens/REQ-UI-009-auth-shared-doc.screen-spec.md`) | Access-state messaging and secure-link lifecycle. |


## Route Artifact Coverage Matrix

| Product Route | Requirement | Backlog Ref | PRD Artifact | Screen Spec Artifact | Coverage Status |
| --- | --- | --- | --- | --- | --- |
| `/dashboard` | `REQ-UI-009` | `REQ-UI-PRD-001` | `docs/prd/REQ-UI-009-dashboard.prd.md` | `docs/screens/REQ-UI-009-dashboard.screen-spec.md` | Complete |
| `/matters` | `REQ-UI-009` | `REQ-UI-PRD-002` | `docs/prd/REQ-UI-009-matters-list.prd.md` | `docs/screens/REQ-UI-009-matters-list.screen-spec.md` | Complete |
| `/matters/[id]` | `REQ-UI-009` | `REQ-UI-PRD-003` | `docs/prd/REQ-UI-009-matter-workspace.prd.md` | `docs/screens/REQ-UI-009-matter-workspace.screen-spec.md` | Complete |
| `/contacts` | `REQ-UI-009` | `REQ-UI-PRD-004` | `docs/prd/REQ-UI-009-contacts.prd.md` | `docs/screens/REQ-UI-009-contacts.screen-spec.md` | Complete |
| `/communications` | `REQ-UI-009` | `REQ-UI-PRD-005` | `docs/prd/REQ-UI-009-communications.prd.md` | `docs/screens/REQ-UI-009-communications.screen-spec.md` | Complete |
| `/documents` | `REQ-UI-009` | `REQ-UI-PRD-006` | `docs/prd/REQ-UI-009-documents.prd.md` | `docs/screens/REQ-UI-009-documents.screen-spec.md` | Complete |
| `/billing` | `REQ-UI-009` | `REQ-UI-PRD-007` | `docs/prd/REQ-UI-009-billing.prd.md` | `docs/screens/REQ-UI-009-billing.screen-spec.md` | Complete |
| `/portal` | `REQ-UI-009` | `REQ-UI-PRD-008` | `docs/prd/REQ-UI-009-portal.prd.md` | `docs/screens/REQ-UI-009-portal.screen-spec.md` | Complete |
| `/ai` | `REQ-UI-009` | `REQ-UI-PRD-009` | `docs/prd/REQ-UI-009-ai.prd.md` | `docs/screens/REQ-UI-009-ai.screen-spec.md` | Complete |
| `/imports` + `/exports` | `REQ-UI-009` | `REQ-UI-PRD-010` | `docs/prd/REQ-UI-009-imports-exports.prd.md` | `docs/screens/REQ-UI-009-imports-exports.screen-spec.md` | Complete |
| `/reporting` + `/admin` | `REQ-UI-009` | `REQ-UI-PRD-011` | `docs/prd/REQ-UI-009-reporting-admin.prd.md` | `docs/screens/REQ-UI-009-reporting-admin.screen-spec.md` | Complete |
| `/login` + `/shared-doc/[token]` | `REQ-UI-009` | `REQ-UI-PRD-012` | `docs/prd/REQ-UI-009-auth-shared-doc.prd.md` | `docs/screens/REQ-UI-009-auth-shared-doc.screen-spec.md` | Complete |

## Backlog Feature Placeholder Specs (Blocked)

| Requirement ID | Feature | Ticket State | Blocker | Notes |
| --- | --- | --- | --- | --- |
| REQ-UI-BLOCK-001 | Advanced conflict rule UX expansion | Blocked | PRD/Screens TBD | Rule profile authoring and reviewer resolution workbench. |
| REQ-UI-BLOCK-002 | Document retention/legal hold expansion | Blocked | PRD/Screens TBD | Policy matrix, hold override and disposition confirmation screens. |
| REQ-UI-BLOCK-003 | Trust reconciliation workspace | Blocked | PRD/Screens TBD | Statement import, discrepancy queues, journal resolution workflow. |
| REQ-UI-BLOCK-004 | LEDES/UTBMS export operations | Blocked | PRD/Screens TBD | Profile configuration, preflight validation, export job status/detail. |
| REQ-UI-BLOCK-005 | Jurisdictional rules-pack manager | Blocked | PRD/Screens TBD | Rule-pack versions, override rationale, conflict policy visibility. |
| REQ-UI-BLOCK-006 | Integration operations console | Blocked | PRD/Screens TBD | OAuth status, sync telemetry, webhook failure triage and replay. |

## Required Content for Each PRD/Screen Spec

- User/role intent
- Inputs and validation
- State model (default/loading/empty/error/success)
- Review-gate transitions where applicable
- Audit evidence fields (actor/action/timestamp/version)
- Accessibility acceptance checks
- Responsive behavior matrix expectations
