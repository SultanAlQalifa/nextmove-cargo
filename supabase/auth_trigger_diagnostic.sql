-- ====================================================================
-- TARGETED AUTH & TRIGGER DIAGNOSTIC
-- ====================================================================
-- 1. LIST ALL TRIGGERS ON auth.users (and their functions)
SELECT trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users';
-- 2. CHECK SOURCE CODE OF TRIGGER FUNCTIONS IN PUBLIC SCHEMA
-- Find functions that are used by triggers.
SELECT p.proname as function_name,
    p.prosrc as source_code
FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';
-- 3. CHECK FOR "is_verified" OR OTHER LEGACY COLUMNS IN TRIGGER FUNCTIONS
SELECT p.proname as function_name,
    p.prosrc as source_code
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND (
        p.prosrc ILIKE '%is_verified%'
        OR p.prosrc ILIKE '%user_roles%'
    );
-- 4. LIST ALL VIEWS AND CHECK FOR ERRORS (COMPREHENSIVE)
DO $$
DECLARE v_record RECORD;
BEGIN FOR v_record IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema IN ('public', 'auth')
) LOOP BEGIN EXECUTE 'SELECT 1 FROM ' || quote_ident(v_record.table_schema) || '.' || quote_ident(v_record.table_name) || ' LIMIT 0';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ CRITICAL: VIEW % . % IS BROKEN: %',
v_record.table_schema,
v_record.table_name,
SQLERRM;
END;
END LOOP;
END $$;
-- 5. CHECK FOR OVERLOADED FUNCTIONS (JUST IN CASE)
SELECT proname,
    count(*)
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
GROUP BY proname
HAVING count(*) > 1;