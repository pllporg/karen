# Backlog Mirror GraphQL Discovery Hardening (KAR-84)

Requirement context: `REQ-OPS-003` follow-on hardening.

## Problem

GitHub mirror sync/verify scripts depended on REST issue listing with label filters. In this environment, REST listing returned empty sets, which caused:

- false `Missing mirrors` failures in verify,
- duplicate mirror issue creation in sync.

## Remediation

1. Added shared GitHub GraphQL helper and paginated issue listing utility:
   - `tools/backlog-sync/common.mjs`
2. Migrated mirror sync issue discovery to GraphQL:
   - `tools/backlog-sync/linear_to_github.mjs`
3. Migrated verify issue discovery to GraphQL:
   - `tools/backlog-sync/verify_backlog_sync.mjs`
4. Hardened Linear-ID mapping to be duplicate-safe (highest issue number wins) in sync and verify.
5. Added executable guard test for script wiring:
   - `apps/api/test/backlog-sync-graphql.spec.ts`

## Verification Commands

- `pnpm --filter api test -- backlog-sync-graphql.spec.ts`
- `pnpm backlog:verify`

## Outcome

Backlog sync/verify now uses GraphQL issue discovery, reducing drift risk from REST label-list inconsistencies and preventing duplicate mirror creation from empty-list false negatives.
