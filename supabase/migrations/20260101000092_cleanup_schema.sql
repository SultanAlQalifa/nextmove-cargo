-- CLEANUP SCHEMA
-- We confirmed 'reference' exists and is used. 'reference_id' is NULL and unused.
-- This script safely drops the legacy column.
ALTER TABLE transactions DROP COLUMN IF EXISTS reference_id;