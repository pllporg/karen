# Import Dedupe Merge Workflow

Requirement: `REQ-PORT-003`  
Scope: user-confirm dedupe workflow across API + web UI.

## API Behavior

- `GET /contacts/dedupe/suggestions`
  - returns candidate pairs with:
    - confidence score + confidence bucket (`HIGH|MEDIUM|LOW`)
    - matching reasons
    - field-level diffs (`displayName`, `kind`, `primaryEmail`, `primaryPhone`, `tags`)
    - current workflow decision (`OPEN|IGNORE|DEFER`)
- `POST /contacts/dedupe/merge`
  - merges duplicate into primary contact.
  - preserves referential integrity via updates to:
    - `MatterParticipant`
    - `ContactMethod`
    - `ContactRelationship` (`from` and `to`)
    - `ExternalReference` (`entityType=contact`)
- `POST /contacts/dedupe/decisions`
  - records explicit user decision (`OPEN|IGNORE|DEFER`) for a candidate pair.

## Audit Events

- Decision actions:
  - `contact.dedupe.ignored`
  - `contact.dedupe.deferred`
  - `contact.dedupe.reopened`
- Merge actions:
  - `contact.merged`
  - `contact.dedupe.merged`

All events are append-only through `AuditService` and keyed by deterministic pair id (`<contactA>::<contactB>` sorted).

## UI Workflow

- Contacts page dedupe panel now includes:
  - confidence + decision status
  - side-by-side field diffs
  - explicit user-confirm actions:
    - `Merge`
    - `Defer`
    - `Ignore`
    - `Reopen` (for deferred/ignored pairs)
- Users can toggle visibility of resolved candidates.
