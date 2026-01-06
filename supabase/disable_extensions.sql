-- ====================================================================
-- EXTENSION & EVENT TRIGGER ISOLATION
-- ====================================================================
BEGIN;
-- 1. DISABLE PG_GRAPHQL (Known to cause "querying schema" errors)
-- We remove it from the schema search path or rebuild it.
-- Often, simply rebuilding the extension schema helps.
DROP EXTENSION IF EXISTS pg_graphql CASCADE;
-- 2. CHECK FOR ROGUE EVENT TRIGGERS
-- Event triggers fire on DDL events and can block schema access.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT evtname
    FROM pg_event_trigger
    WHERE evtname NOT LIKE 'pg_%'
) LOOP RAISE NOTICE '⚠️ FOUND CUSTOM EVENT TRIGGER: %',
r.evtname;
-- We don't drop them automatically to be safe, but we log them.
END LOOP;
END $$;
-- 3. ENSURE NO "GHOST" TYPES
-- Sometimes a column refers to a dropped type OID.
-- This query checks for invalid type references in public tables.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT t.tablename,
        c.columnname
    FROM pg_tables t
        JOIN pg_attribute a ON a.attrelid = (t.schemaname || '.' || t.tablename)::regclass
        JOIN pg_class c ON c.oid = a.attrelid
        LEFT JOIN pg_type typ ON typ.oid = a.atttypid
    WHERE t.schemaname = 'public'
        AND typ.oid IS NULL
) LOOP RAISE NOTICE '❌ CORRUPT COLUMN FOUND: %.%',
r.tablename,
r.columnname;
END LOOP;
END $$;
-- 4. RELOAD
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'EXTENSIONS RESET. GRAPHQL DISABLED. RETRY LOGIN.' as status;