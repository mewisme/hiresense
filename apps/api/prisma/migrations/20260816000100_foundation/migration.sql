-- HireSense / Phase 0 / Foundation
-- PostgreSQL 18 + pgvector
-- All application timestamps are UTC and all PKs use database-generated UUIDv7.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Persist UTC as the database default for future sessions.
DO $$
BEGIN
  EXECUTE format(
    'ALTER DATABASE %I SET timezone TO %L',
    current_database(),
    'UTC'
  );
END
$$;

-- Also force UTC for the current migration session.
SET TIME ZONE 'UTC';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at()
IS 'HireSense standard trigger function for mutable-row updated_at timestamps.';
