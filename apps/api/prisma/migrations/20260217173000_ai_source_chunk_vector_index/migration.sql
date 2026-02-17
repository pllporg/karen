-- pgvector similarity acceleration for AI source-chunk retrieval.
ALTER TABLE "AiSourceChunk"
ALTER COLUMN "embedding" TYPE vector(1536);

CREATE INDEX IF NOT EXISTS "AiSourceChunk_embedding_ivfflat_idx"
ON "AiSourceChunk"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100)
WHERE "embedding" IS NOT NULL;
