# REQ-COMM-002 Parity Evidence: Communications Search Relevance + Indexing

Requirement: `REQ-COMM-002`  
Prompt section: `Communications / search by keyword (Postgres full-text)`

## Implemented

- Upgraded communication keyword search strategy in `CommunicationsService.search`:
  - primary path uses `websearch_to_tsquery` + ranked full-text matching (`ts_rank_cd`)
  - ordering by relevance first, then recency
  - highlighted snippets via `ts_headline`
- Added fallback path for edge cases:
  - substring `ILIKE` search when full-text returns no rows
  - explicit `matchStrategy` (`full_text` or `substring`) and rank in response payload
- Added indexing migration for production relevance performance:
  - `apps/api/prisma/migrations/20260217165500_communication_search_indexing/migration.sql`
  - GIN index over communication message full-text vector expression

## Verification

- API tests:
  - `apps/api/test/communications-search.spec.ts`
  - existing compatibility tests retained:
    - `apps/api/test/communications-portal-attachments.spec.ts`
    - `apps/api/test/communications-delivery.spec.ts`

## Notes

- Search remains tenant-scoped and matter-scoped when `matterId` filter is provided.
- Response shape now includes ranking/snip metadata suitable for UI relevance sorting.
