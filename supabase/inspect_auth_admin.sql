-- ====================================================================
-- AUDIT: SUPABASE AUTH ADMIN ROLE
-- ====================================================================
-- 1. Identify the Auth Admin Role (usually supabase_auth_admin)
SELECT rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls
FROM pg_roles
WHERE rolname LIKE '%auth_admin%'
    OR rolname = 'service_role';
-- 2. Inspect Role Memberships (Is it a member of postgres? Service_role?)
SELECT r.rolname,
    ARRAY(
        SELECT b.rolname
        FROM pg_auth_members m
            JOIN pg_roles b ON (m.roleid = b.oid)
        WHERE m.member = r.oid
    ) as member_of
FROM pg_roles r
WHERE r.rolname = 'supabase_auth_admin';
-- 3. Check Catalog Permissions (Can it verify the schema?)
SELECT has_schema_privilege('supabase_auth_admin', 'pg_catalog', 'usage') AS catalog_usage,
    has_schema_privilege(
        'supabase_auth_admin',
        'information_schema',
        'usage'
    ) AS info_usage,
    has_schema_privilege('supabase_auth_admin', 'auth', 'usage') AS auth_usage,
    has_schema_privilege('supabase_auth_admin', 'public', 'usage') AS public_usage,
    has_schema_privilege('supabase_auth_admin', 'public', 'create') AS public_create;
-- 4. Check Config / Search Path
SELECT rolname,
    rolconfig
FROM pg_roles
WHERE rolname = 'supabase_auth_admin';
-- 5. Check Auth Tables visibility
SELECT has_table_privilege('supabase_auth_admin', 'auth.users', 'select') AS read_users,
    has_table_privilege('supabase_auth_admin', 'auth.users', 'insert') AS insert_users,
    has_table_privilege(
        'supabase_auth_admin',
        'auth.schema_migrations',
        'select'
    ) AS read_migrations;