-- ====================================================================
-- SUPABASE AI DEEP SCAN (SECTION A)
-- ====================================================================
-- 1. INFOS ROLE AUTHENTICATOR
SELECT '--- 1. ROLE INFO ---' as section;
SELECT rolname,
    oid,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls,
    rolvaliduntil,
    rolinherit
FROM pg_roles
WHERE rolname = 'authenticator';
-- 2. ACL SCHEMA PUBLIC
SELECT '--- 2. PUBLIC ACL ---' as section;
SELECT nspname,
    nspowner,
    pg_catalog.array_to_string(nspacl, ', ') as acl
FROM pg_namespace
WHERE nspname = 'public';
-- 3. TABLES PUBLIQUES (Sample)
SELECT '--- 3. TABLE ACLs ---' as section;
SELECT nsp.nspname AS schema,
    c.relname AS table,
    c.relowner,
    pg_get_userbyid(c.relowner) AS owner,
    pg_catalog.array_to_string(c.relacl, ', ') as acl
FROM pg_class c
    JOIN pg_namespace nsp ON c.relnamespace = nsp.oid
WHERE nsp.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm')
ORDER BY table
LIMIT 10;
-- 4. MEMBERSHIPS (CRITICAL)
SELECT '--- 4. MEMBERSHIPS ---' as section;
SELECT r.rolname AS role,
    m.roleid::regrole AS member_of,
    m.admin_option
FROM pg_auth_members m
    JOIN pg_roles r ON m.member = r.oid
WHERE r.rolname = 'authenticator'
UNION ALL
SELECT rolname,
    NULL,
    NULL
FROM pg_roles
WHERE rolname = 'authenticator';
-- 5. TEST PRIVILEGES EFFECTIFS
SELECT '--- 5. EFFECTIVE PRIVILEGES ---' as section;
SELECT has_schema_privilege('authenticator', 'public', 'usage') AS can_use_public,
    has_schema_privilege('authenticator', 'public', 'create') AS can_create_public;
-- 6. DEPENDANCES ETRANGES
SELECT '--- 6. WEIRD DEPENDENCIES ---' as section;
SELECT n.nspname,
    p.proname,
    p.prosecdef
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%authenticator%'
    OR p.prosecdef = true
ORDER BY n.nspname,
    p.proname
LIMIT 10;
-- 7. REQUETES BLOQUEES RECENTES
SELECT '--- 7. BLOCKED QUERIES ---' as section;
SELECT pid,
    usename,
    state,
    query,
    query_start
FROM pg_stat_activity
WHERE state NOT IN ('idle')
    OR query ILIKE '%permission%'
    OR query ILIKE '%permission denied%'
ORDER BY query_start DESC
LIMIT 5;