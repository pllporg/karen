# Communications Search Indexing Verification

Requirement: `REQ-COMM-002`  
Scope: verify ranked full-text communications search with tenant/matter scoping, safe fallback behavior, and indexing guardrails.

## Verification Coverage

- API regression suites:
  - `apps/api/test/communications-search.spec.ts`
  - `apps/api/test/communications-portal-attachments.spec.ts`
  - `apps/api/test/communications-delivery.spec.ts`
- Indexing migration:
  - `apps/api/prisma/migrations/20260217165500_communication_search_indexing/migration.sql`

### Search hardening checks

- Primary search path remains ranked full-text:
  - `websearch_to_tsquery`
  - `ts_rank_cd`
  - ordered by relevance then recency
  - highlighted snippets via `ts_headline`
- Fallback substring path remains available when no full-text rows are found:
  - `ILIKE`-based matching with explicit `matchStrategy: substring`
  - wildcard escaping for `%` and `_` is verified to prevent over-broad pattern matching
- Matter scoping controls are verified:
  - `matterId` search requires `assertMatterAccess(..., 'read')`
  - SQL includes matter filter in scoped queries
- Query normalization guardrails are verified:
  - whitespace compaction before execution
  - oversized queries capped to bounded length before tsquery generation

## Commands

- `pnpm --filter api test -- communications-search.spec.ts`
- `pnpm --filter api test -- communications-delivery.spec.ts communications-portal-attachments.spec.ts`

## Result

`REQ-COMM-002` is verified with ranked full-text relevance, GIN-backed indexing, scoped query enforcement, wildcard-safe fallback search, and bounded query normalization.
