-- ====================================================================
-- SUPABASE AI DIAGNOSTIC SCRIPT (ALL-IN-ONE) - CORRECTED
-- ====================================================================
-- 1. TRIGGER POSTGREST RELOAD
SELECT pg_notify('pgrst', 'reload');
-- 2. INSPECT SECURITY DEFINER FUNCTIONS
SELECT '--- SECURITY DEFINER FUNCTIONS ---' as section;
SELECT n.nspname AS schema,
    p.proname AS function_name,
    p.prosecdef
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
    AND p.prosecdef = true
ORDER BY n.nspname,
    p.proname;
-- 3. CHECK VIEWS
SELECT '--- VIEWS ---' as section;
SELECT table_schema,
    table_name
FROM information_schema.views
WHERE table_schema IN ('public', 'auth')
ORDER BY table_schema,
    table_name;
-- 4. CHECK SCHEMA PRIVILEGES (CORRECTED COLUMN: nspacl)
SELECT '--- SCHEMA PRIVILEGES ---' as section;
SELECT nspname,
    nspowner,
    array_agg(distinct acl::text) AS acl
FROM pg_namespace,
    unnest(nspacl) as acl
WHERE nspname IN ('public', 'auth', 'pg_catalog', 'realtime')
GROUP BY nspname,
    nspowner;
-- 5. CHECK PG_CATALOG TABLE PERMISSIONS (CORRECTED COLUMN: relacl)
SELECT '--- CATALOG PERMISSIONS ---' as section;
SELECT relname,
    relkind,
    relowner,
    array_agg(distinct acl::text) as permissions
FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid,
    unnest(relacl) as acl
WHERE n.nspname = 'pg_catalog'
    AND relname IN ('pg_tables', 'pg_views', 'pg_class', 'pg_namespace')
GROUP BY relname,
    relkind,
    relowner
ORDER BY relname;
-- 6. AUTHENTICATOR ACCESS TEST
SELECT '--- AUTHENTICATOR ACCESS TEST ---' as section;
DO $$
DECLARE r RECORD;
BEGIN RAISE NOTICE 'Testing Authenticator Access...';
EXECUTE 'SET ROLE authenticator';
BEGIN
SELECT table_name INTO r
FROM information_schema.tables
LIMIT 1;
RAISE NOTICE 'SUCCESS: Authenticator can read information_schema.';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'FAILURE: Authenticator cannot read information_schema. Error: %',
SQLERRM;
END;
EXECUTE 'RESET ROLE';
END $$;
-- 7. CHECK ACTIVE QUERIES
SELECT '--- ACTIVE QUERIES ---' as section;
SELECT pid,
    usename,
    query,
    state
FROM pg_stat_activity
WHERE state <> 'idle'
LIMIT 5;
-- 8. EXTENSIONS
SELECT '--- EXTENSIONS ---' as section;
SELECT extname,
    extversion
FROM pg_extension;