-- ====================================================================
-- SUPABASE AI DIAGNOSTIC SCRIPT (ALL-IN-ONE)
-- ====================================================================
-- 1. TRIGGER POSTGREST RELOAD (To capture errors in logs)
SELECT pg_notify('pgrst', 'reload');
-- 2. INSPECT SECURITY DEFINER FUNCTIONS (Public & Auth)
SELECT '--- SECURITY DEFINER FUNCTIONS ---' as section;
SELECT n.nspname AS schema,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS ddl
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
    AND p.prosecdef = true
ORDER BY n.nspname,
    p.proname;
-- 3. CHECK VIEWS (Definitions)
SELECT '--- VIEWS DEFINITIONS ---' as section;
SELECT table_schema,
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema IN ('public', 'auth')
ORDER BY table_schema,
    table_name;
-- 4. CHECK SCHEMA PRIVILEGES
SELECT '--- SCHEMA PRIVILEGES ---' as section;
SELECT nspname,
    nspowner,
    array_agg(distinct acl::text) AS acl
FROM pg_namespace
WHERE nspname IN ('public', 'auth', 'pg_catalog', 'realtime')
GROUP BY nspname,
    nspowner;
-- 5. CHECK PG_CATALOG TABLE PERMISSIONS
SELECT '--- CATALOG PERMISSIONS ---' as section;
SELECT relname,
    relkind,
    relowner,
    relacl
FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'pg_catalog'
    AND relname IN ('pg_tables', 'pg_views', 'pg_class', 'pg_namespace')
ORDER BY relname;
-- 6. SEARCH FOR RESIDUAL AUTH FUNCTIONS
SELECT '--- RESIDUAL AUTH FUNCTIONS ---' as section;
SELECT n.nspname,
    p.proname,
    pg_get_functiondef(p.oid)
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (
        p.proname ILIKE '%auth%'
        OR p.proname ILIKE '%user_created%'
        OR p.proname ILIKE '%on_auth%'
    )
    AND n.nspname = 'public';
-- 7. TEST AUTHENTICATOR ACCESS (Simulation)
SELECT '--- AUTHENTICATOR ACCESS TEST ---' as section;
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Testing Authenticator Access...';
-- Try to switch role
EXECUTE 'SET ROLE authenticator';
-- Try to read a system table
BEGIN
SELECT table_name INTO r
FROM information_schema.tables
LIMIT 1;
RAISE NOTICE 'SUCCESS: Authenticator can read information_schema.';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'FAILURE: Authenticator cannot read information_schema. Error: %',
SQLERRM;
END;
-- Reset Role
EXECUTE 'RESET ROLE';
END $$;
-- 8. CHECK ACTIVE QUERIES / FAILURES
SELECT '--- ACTIVE QUERIES ---' as section;
SELECT pid,
    usename,
    query,
    state,
    backend_start,
    query_start
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start DESC
LIMIT 20;
-- 9. LIST EXTENSIONS
SELECT '--- EXTENSIONS ---' as section;
SELECT extname,
    extversion
FROM pg_extension
ORDER BY extname;
-- 10. CHECK AUTH SCHEMA COLUMNS
SELECT '--- AUTH SCHEMA COLUMNS ---' as section;
SELECT table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
ORDER BY table_name,
    ordinal_position;