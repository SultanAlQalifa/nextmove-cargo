-- ====================================================================
-- ULTIMATE SCHEMA DIAGNOSTIC SCRIPT (NextMove Cargo)
-- Run this in your Supabase SQL Editor and share the results.
-- ====================================================================
-- 1. SEARCH FOR OVERLOADED FUNCTIONS
-- Overloaded functions can crash PostgREST schema introspection.
SELECT n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    count(*) OVER (PARTITION BY p.proname) as overload_count
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY overload_count DESC,
    function_name;
-- 2. SEARCH FOR BROKEN VIEWS
-- Attempts to select from every view to see which ones fail.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
) LOOP BEGIN EXECUTE 'SELECT 1 FROM public.' || quote_ident(r.table_name) || ' WHERE FALSE';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'BROKEN VIEW DETECTED: % (%)',
r.table_name,
SQLERRM;
END;
END LOOP;
END $$;
-- 3. SEARCH FOR "is_verified" IN ALL OBJECTS
-- Searches for the troublesome string in function bodies and view definitions.
SELECT n.nspname as schema,
    'FUNCTION' as type,
    p.proname as name,
    'Source code contains is_verified' as issue
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND p.prosrc ILIKE '%is_verified%'
UNION ALL
SELECT schemaname as schema,
    'VIEW' as type,
    viewname as name,
    'Definition contains is_verified' as issue
FROM pg_views
WHERE schemaname = 'public'
    AND definition ILIKE '%is_verified%';
-- 4. CHECK "get_my_role" DEFINITION
SELECT proname,
    prosrc,
    provolatile,
    prosecdef
FROM pg_proc
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND proname = 'get_my_role';
-- 6. SEARCH FOR FUNCTIONS WITH MISSING OR INVALID RETURN TYPES
SELECT p.proname as function_name,
    p.prorettype::regtype as return_type
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND p.prorettype::regtype::text = 'unknown';
-- 7. SEARCH FOR ORPHANED TRIGGERS
-- Triggers pointing to functions that don't exist (shouldn't happen but good to check).
SELECT tgname as trigger_name,
    relname as table_name
FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
WHERE tgisinternal IS FALSE
    AND NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE oid = tgfoid
    );
-- 5. CHECK AUTHENTICATOR SEARCH_PATH
-- PostgREST uses the 'authenticator' role. Its search_path must be correct.
SELECT rolname,
    rolconfig
FROM pg_roles
WHERE rolname = 'authenticator';