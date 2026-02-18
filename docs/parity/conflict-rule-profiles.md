# Advanced Conflict Rule Profiles + Resolution Workflow

Requirement: `REQ-MAT-004`  
Scope: profile-based conflict checks with weighted scoring, recommendation output, and auditable attorney resolution workflow.

## API Coverage

- Conflict rule profile management:
  - `GET /admin/conflict-rule-profiles`
  - `POST /admin/conflict-rule-profiles`
  - `PATCH /admin/conflict-rule-profiles/:id`
- Conflict check execution and review:
  - `POST /admin/conflict-checks`
  - `GET /admin/conflict-checks`
  - `POST /admin/conflict-checks/:id/resolve`

## Behavior Implemented

- Profiles are organization-scoped and persisted in `Organization.settingsJson.conflictRuleProfiles`.
- Profile fields include:
  - scope selectors (`practiceAreas`, `matterTypeIds`)
  - weighted criteria (`name`, `email`, `phone`, `matter`, `relationship`)
  - thresholds (`warn`, `block`)
  - default/active flags
- Conflict execution:
  - computes entity hits (contacts + matters) with rule-level reasons
  - returns top score and recommendation (`CLEAR`/`WARN`/`BLOCK`)
  - stores execution payload on `ConflictCheckResult.resultJson`
- Resolution workflow:
  - requires attorney rationale
  - persists current resolution state and append-only `resolutionHistory`
  - appends audit events for execution and resolution actions

## Admin UI Coverage

- `apps/web/app/admin/page.tsx` adds:
  - conflict profile create/manage section
  - conflict check runner (query + profile selection)
  - check table with recommendation/score and resolve action

## Test Evidence

- API regression coverage:
  - `apps/api/test/admin.spec.ts`
  - `apps/api/test/admin-conflict-verification.spec.ts`
  - verifies:
    - profile upsert in organization settings
    - conflict check execution with scoring flow
    - resolution with rationale and audit event
    - partial profile updates preserve existing scope/weights/thresholds/default flags
    - default profile fallback re-assignment when deactivating prior default
    - scoped profile selection precedence (most specific active match wins over global default)
- Full-suite validation:
  - `pnpm test`
  - `pnpm build`

## Verification Command

- `pnpm --filter api test -- admin-conflict-verification.spec.ts admin.spec.ts`
