-- Base extension requirements
CREATE EXTENSION IF NOT EXISTS vector;

-- NOTE:
-- The full DDL for all Prisma models is generated from `schema.prisma`.
-- In a Node-enabled environment, run:
--   pnpm --filter api prisma:migrate
-- to materialize the complete schema and append generated SQL migrations.

-- Optional post-migration index (run after Prisma-generated table creation):
-- CREATE INDEX IF NOT EXISTS idx_communication_message_fts
-- ON "CommunicationMessage"
-- USING GIN (to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body, '')));
