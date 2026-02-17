# REQ-DATA-003 Parity Evidence: pgvector Similarity Retrieval

Requirement: `REQ-DATA-003`  
Prompt section: `Vector: pgvector / AI Layer`

## Implemented

- Added production retrieval path in `AiService.buildMatterContext`:
  - query embeddings generated from tool + payload context
  - matter-scoped pgvector similarity query against `AiSourceChunk.embedding`
  - blocked chunks still excluded from AI context after retrieval
- Added fallback behavior:
  - if query embedding unavailable or vector query fails/returns empty, service falls back to recent matter chunks
  - retrieval metadata (`mode`, `reason`, `queryText`) returned in context for observability
- Added embedding persistence for pgvector column:
  - ingestion still stores JSON embeddings (`embeddingJson`)
  - when embeddings are present, ingestion also writes vector column for similarity search
  - vector write failures are fail-soft to avoid breaking ingestion in constrained environments
- Added pgvector index migration:
  - `apps/api/prisma/migrations/20260217173000_ai_source_chunk_vector_index/migration.sql`
  - IVFFlat cosine index on `AiSourceChunk.embedding` (partial index on non-null vectors)

## Verification

- API tests:
  - `apps/api/test/ai-vector-retrieval.spec.ts`
  - `apps/api/test/ai-ingestion-security.spec.ts`
- Full regression:
  - `pnpm test`
  - `pnpm build`

## Notes

- Retrieval remains organization and matter scoped.
- Systems without OpenAI embeddings or vector execution support continue to operate via deterministic recency fallback.
