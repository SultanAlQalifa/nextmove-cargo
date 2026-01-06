-- ====================================================================
-- DEEP SCHEMA DIAGNOSTIC v2 (CORRECTED)
-- ====================================================================
-- 1. TEST ALL VIEWS (Identify broken ones)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
) LOOP BEGIN EXECUTE format(
    'SELECT 1 FROM %I.%I LIMIT 0',
    r.table_schema,
    r.table_name
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ BROKEN VIEW FOUND: %.% - Error: %',
r.table_schema,
r.table_name,
SQLERRM;
END;
END LOOP;
END $$;
-- 2. IDENTIFY OVERLOADED FUNCTIONS (Corrected Syntax)
WITH overloaded AS (
    SELECT proname,
        COUNT(*) as nb
    FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    GROUP BY proname
    HAVING COUNT(*) > 1
)
SELECT n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    o.nb
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN overloaded o ON o.proname = p.proname
WHERE n.nspname = 'public';
-- 3. CHECK FOR INVALID RETURN TYPES (e.g. RECORD without OUT params)
SELECT proname,
    typname as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
    JOIN pg_type t ON p.prorettype = t.oid
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND t.typname IN ('record', 'opaque');
-- 4. CHECK FOR "is_verified" IN SOURCE CODE
SELECT proname,
    n.nspname as schema
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc ILIKE '%is_verified%'
    AND n.nspname IN ('public', 'auth');
-- 5. LIST RECENT DEBUG LOGS
SELECT *
FROM public.debug_logs
ORDER BY created_at DESC
LIMIT 5;