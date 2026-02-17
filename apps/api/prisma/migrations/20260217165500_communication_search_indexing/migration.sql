-- Improve communication search relevance by supporting ranked full-text lookups.
CREATE INDEX IF NOT EXISTS "CommunicationMessage_search_tsv_idx"
ON "CommunicationMessage"
USING GIN (to_tsvector('english', coalesce("subject",'') || ' ' || coalesce("body",'')));
