# Data Model Parity Checklist

Requirement: `REQ-DATA-001`  
Prompt section: `DATA MODEL REQUIREMENTS (Prisma) — Minimum Entities`

This checklist maps prompt-required entities/capabilities to Prisma models in `apps/api/prisma/schema.prisma`, with explicit gap tracking for missing or partial coverage.

## Status Legend

- `Complete`: Entity/capability is represented in schema with required core relations.
- `Partial`: Model exists, but prompt-required behavior/coverage is incomplete.
- `Missing`: Required model/capability is not represented yet.

## 1) Tenancy / Users / Security

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Organization | `Organization` | Complete | Tenant root for organization-scoped entities. | — |
| User | `User` | Complete | User linked to memberships, sessions, audit, assignee roles. | — |
| Membership | `Membership` | Complete | `organizationId + userId` uniqueness, role/contact mapping. | — |
| Role | `Role` | Complete | Organization-scoped role definitions. | — |
| Permission | `Permission` | Complete | Many-to-many with roles via `RolePermissions`. | — |
| MatterTeam | `MatterTeam` | Complete | Matter-level team for ethical wall composition. | — |
| MatterTeamMember | `MatterTeamMember` | Complete | User membership at matter team granularity. | — |
| AccessPolicy / ABAC hooks | `AccessPolicy` | Partial | Policy records exist; extensible composition/evaluation contract still in progress. | `REQ-DATA-002` |
| AuditLogEvent (append-only, tamper-evident hash chain) | `AuditLogEvent` | Complete | `previousHash` + `eventHash` fields support tamper-evident chain. | — |

## 2) Contacts & Relationship Graph

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Unified Contact | `Contact` | Complete | Person/org kinds, primary channels, tags, org tenancy. | — |
| Person profile | `PersonProfile` | Complete | 1:1 subtype via unique `contactId`. | — |
| Organization profile | `OrganizationProfile` | Complete | 1:1 subtype via unique `contactId`. | — |
| Contact method | `ContactMethod` | Complete | One-to-many typed methods with `isPrimary`. | — |
| Contact relationship graph | `ContactRelationship` | Complete | Directional edge (`fromContactId` -> `toContactId`) with type + notes. | — |

## 3) Matters / Cases

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Matter | `Matter` | Complete | Core case object with type, stage, status, lifecycle timestamps. | — |
| Matter stage pipelines | `MatterStage` | Complete | Per-org practice-area pipeline stages. | — |
| Matter type | `MatterType` | Complete | Configurable matter classification and section linkage. | — |
| Configurable participant roles | `ParticipantRoleDefinition` | Complete | Role key/label/description + default side, org-scoped. | — |
| Matter participants table | `MatterParticipant` | Partial | Supports side, primary, represented-by, law-firm linkage; broader role workflow coverage still being finalized. | `REQ-MAT-001` |
| Related matters | `MatterRelationship` | Complete | Directed matter-to-matter relationship graph. | — |

## 4) Custom Fields + Configurable Sections

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Custom field definitions | `CustomFieldDefinition` | Complete | Org + entity-type scoped flexible definitions. | — |
| Custom field values | `CustomFieldValue` | Complete | Polymorphic entity target (`entityType`, `entityId`) + JSON value. | — |
| Section definitions | `SectionDefinition` | Complete | Matter-type scoped JSON schema sections. | — |
| Section instances | `SectionInstance` | Complete | Matter-scoped section data + `updatedByUserId`. | — |

## 5) Tasks / Workflows

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Task | `Task` | Complete | Matter linked, assignee, checklist/dependency JSON. | — |
| Task template | `TaskTemplate` | Complete | Reusable template payloads. | — |
| Matter template | `MatterTemplate` | Complete | Matter provisioning template config. | — |
| Stage automation | `StageAutomation` | Complete | Stage transition action templates. | — |
| Reminder | `Reminder` | Complete | User/matter/task reminder with channel + status. | — |
| Notification | `Notification` | Complete | User-scoped system notifications. | — |

## 6) Calendar / Deadlines / Dockets

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Calendar event | `CalendarEvent` | Complete | Matter-scoped date ranges, attendees JSON, source metadata. | — |
| Deadline rule template | `DeadlineRuleTemplate` | Complete | Trigger + offset metadata for derived deadlines. | — |
| Jurisdictional deadline rules pack | `DeadlineRuleTemplate` (`triggerType='RULES_PACK'`) | Complete | Versioned jurisdiction/court/procedure packs represented in `configJson.pack` + rule set in `configJson.rules`, with preview/apply workflow and override governance. | — |
| Service event | `ServiceEvent` | Complete | Trigger events for deadline logic. | — |
| Docket entry | `DocketEntry` | Complete | Filing record with optional source document linkage. | — |
| ICS export capability | API/export logic | Complete | Implemented as export behavior; not a dedicated Prisma model. | — |

## 7) Communications Hub

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Communication thread | `CommunicationThread` | Complete | Linked to matter and/or contact. | — |
| Communication message | `CommunicationMessage` | Complete | Typed messages with direction, subject/body, occurrence time, creator. | — |
| Message participants | `CommunicationParticipant` | Complete | Role-based message participants (`FROM/TO/CC/BCC/OTHER`). | — |
| Message attachments to document versions | `CommunicationAttachment` | Complete | Bridge table message <-> `DocumentVersion`. | — |

## 8) Documents / Evidence + Retention

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Document | `Document` | Complete | Matter-scoped metadata + confidentiality + client-sharing flags. | — |
| Document version | `DocumentVersion` | Complete | Hashing/storage metadata + uploader relation. | — |
| Document folder | `DocumentFolder` | Complete | Nested folder hierarchy with parent/child references. | — |
| Share link | `DocumentShareLink` | Complete | Expiring/revocable signed-share tokens. | — |
| Evidence item | `EvidenceItem` | Complete | Evidence wrapper linking to document version. | — |
| Document retention policy | `DocumentRetentionPolicy` | Complete | Policy supports scope (`ALL_DOCUMENTS`/`MATTER`/`CATEGORY`), trigger (`DOCUMENT_UPLOADED`/`MATTER_CLOSED`), retention period, approval gate, and assignment to documents. | — |
| Legal hold | `DocumentLegalHold` | Complete | Active/released hold lifecycle with placed/released user attribution, hold reason, and document-level legal-hold enforcement. | — |
| Retention disposition workflow | `DocumentDispositionRun`, `DocumentDispositionItem`, `Document.dispositionStatus` | Complete | Approval-gated disposition queue, legal-hold skip behavior, execution metadata, and document disposition status tracking with audit events. | — |

## 9) Time / Billing / Trust

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Time entry | `TimeEntry` | Complete | Matter/user link, duration/amount, UTBMS fields. | — |
| Expense | `Expense` | Complete | Matter-linked expense with optional receipt version. | — |
| Invoice | `Invoice` | Complete | Matter invoice with status, totals, disclaimers, PDF + checkout refs. | — |
| Invoice line item | `InvoiceLineItem` | Complete | Supports time/expense linkage + UTBMS columns. | — |
| Payment | `Payment` | Complete | Invoice-linked Stripe/manual payment records. | — |
| Trust account | `TrustAccount` | Complete | Bank/trust account metadata. | — |
| Trust transaction | `TrustTransaction` | Complete | Account + matter-linked trust movement records. | — |
| Matter trust ledger | `MatterTrustLedger` | Complete | Per-matter trust balance snapshots by account. | — |
| Trust reconciliation run | `TrustReconciliationRun` | Complete | Trust-account scoped statement-period run lifecycle with preparer/sign-off user attribution, period totals, and completion controls. | — |
| Trust reconciliation discrepancy | `TrustReconciliationDiscrepancy` | Complete | Run-linked discrepancy queue with amount deltas, reason code/notes, resolver attribution, and resolved/waived outcomes. | — |
| LEDES export profile | `LEDESExportProfile` | Missing | No profile model for LEDES formatting + validation defaults yet. | `REQ-BILL-004` |
| LEDES export job | `LEDESExportJob` | Missing | Generic `ExportJob` exists, but no invoice/profile-specific LEDES job model. | `REQ-BILL-004` |

## 10) CRM / Intake / Conflict

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Lead | `Lead` | Complete | Intake lead pipeline with referral + assignee linkage. | — |
| Intake form definition | `IntakeFormDefinition` | Complete | Org-scoped schema-driven forms. | — |
| Intake submission | `IntakeSubmission` | Complete | Links to form + lead/matter context. | — |
| Conflict check result | `ConflictCheckResult` | Partial | Base result logging exists; advanced rule profile + resolution workflow missing. | `REQ-MAT-004` |
| Conflict rule profile assignment | `ConflictRuleProfileAssignment` | Missing | No rule-profile/scoping model for advanced conflict policies yet. | `REQ-MAT-004` |
| Conflict resolution decision | `ConflictResolutionDecision` | Missing | No attorney override/decision audit model tied to conflict results yet. | `REQ-MAT-004` |
| Engagement letter template | `EngagementLetterTemplate` | Complete | Template + merge fields metadata. | — |
| E-sign envelope | `ESignEnvelope` | Complete | Matter/document scoped envelope stub with provider refs. | — |

## 11) AI Layer + RAG Governance

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| AI job | `AiJob` | Complete | Matter-scoped asynchronous AI workflow execution record. | — |
| AI artifact | `AiArtifact` | Complete | Review workflow (`DRAFT/APPROVED/REJECTED`) + reviewer relation. | — |
| AI source chunk | `AiSourceChunk` | Partial | Chunk/embedding storage exists; vector similarity production path remains in progress. | `REQ-DATA-003` |
| Style pack | `StylePack` | Complete | Org-scoped drafting style profile. | — |
| Style pack source doc | `StylePackSourceDoc` | Complete | Bridge to source `DocumentVersion` records. | — |
| AI provenance log | `AiExecutionLog` | Complete | Stores prompt/source refs/model params + actor identity. | — |

## 12) Portability / Migration / External IDs

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Stable UUID PKs on core entities | Most models (`id @default(uuid())`) | Complete | UUID PK convention used across core domain models. | — |
| External reference envelope | `ExternalReference` | Complete | Tracks source system IDs, parent IDs, import batch and raw payload. | — |
| Import batch | `ImportBatch` | Complete | Source + status + starter + mapping profile with lifecycle timestamps. | — |
| Import item | `ImportItem` | Complete | Row/entity resolution and warning/error JSON per row. | — |
| Mapping profile | `MappingProfile` | Complete | Field map/transform/dedupe/conflict policy JSON storage. | — |
| Conflict rule profile (import/canonical advanced matching) | dedicated model absent | Missing | Represented only as JSON fields today; no first-class reusable profile model. | `REQ-MAT-004` |
| Dedupe engine (fuzzy + user-confirm merge UI) | Service/UI behavior | Partial | Data hooks exist; end-user merge confirmation flow still in progress. | `REQ-PORT-003` |
| Raw source payload consistency across core entities | `rawSourcePayload` fields + `ExternalReference.rawSourcePayload` | Partial | Several core tables include payload; not uniformly represented on every core table. | `REQ-PORT-001`, `REQ-PORT-002` |

## 13) Construction Litigation Domain Extensions

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Property profile | `PropertyProfile` | Complete | 1:1 matter profile with location + permits/inspections JSON. | — |
| Contract profile | `ContractProfile` | Complete | 1:1 matter profile with price/schedule/change/warranty JSON. | — |
| Project milestone | `ProjectMilestone` | Complete | Matter-scoped planned vs actual timeline milestones. | — |
| Defect/issue | `DefectIssue` | Complete | Category/location/severity + photo doc version references. | — |
| Damages | `DamagesItem` | Complete | Repair, paid, completion, consequential values by item. | — |
| Lien model | `LienModel` | Complete | Matter + claimant + amount/date/status + document linkage. | — |
| Insurance claim | `InsuranceClaim` | Complete | Matter + adjuster/insurer contacts + coverage status notes. | — |
| Expert engagement | `ExpertEngagement` | Complete | Matter + expert + scope/fees + report document linkage. | — |

## 14) Integration + Webhook Data Surfaces

| Prompt Entity / Capability | Prisma Model(s) | Status | Key Relation Semantics | Gap Tracking |
| --- | --- | --- | --- | --- |
| Integration connection (encrypted OAuth tokens) | `IntegrationConnection` | Complete | Provider, encrypted token envelope, scopes, sync metadata. | — |
| Incremental sync run + idempotency | `IntegrationSyncRun` | Complete | Connection-linked run log with idempotency key + cursor. | — |
| Webhook subscription registry | `IntegrationWebhookSubscription` | Complete | Provider subscription records with status/external IDs. | — |
| Public webhook endpoint + delivery | `WebhookEndpoint`, `WebhookDelivery` | Complete | Endpoint secret/events and delivery attempt state tracking. | — |

## Explicit Gap Register (Opened / Tracked)

These gaps are explicitly tracked in the parity matrix and Linear backlog:

| Gap | Requirement ID | Why It Is Open |
| --- | --- | --- |
| AccessPolicy abstraction and composable ABAC reasoned evaluation | `REQ-DATA-002` | Model exists; policy engine abstraction still partial. |
| Pgvector retrieval production path for AI chunks | `REQ-DATA-003` | Storage exists; retrieval ranking path still partial. |
| Participant role workflow semantics completeness | `REQ-MAT-001` | Core schema exists; end-to-end role semantics still partial. |
| Advanced conflict rule profiles + resolution decision logging | `REQ-MAT-004` | Missing first-class conflict profile/decision entities. |
| LEDES profile/job entities | `REQ-BILL-004` | Standards-oriented profile/job data model missing. |
| Dedupe user-confirm merge workflow | `REQ-PORT-003` | Import framework exists; user-confirm merge flow still partial. |
| Import payload coverage consistency | `REQ-PORT-001`, `REQ-PORT-002` | Raw payload and mapping coverage not fully uniform yet. |

## Completion Criteria for `REQ-DATA-001`

- Checklist committed in-repo: `docs/parity/data-model-checklist.md`
- Prompt-required entities mapped to schema models with status and key relation semantics.
- Missing/partial entity behavior explicitly linked to existing requirement IDs for implementation follow-through.
