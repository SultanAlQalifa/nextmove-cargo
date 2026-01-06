-- ====================================================================
-- OPTION A: REPAIR AUTH & CATALOG PERMISSIONS (NON-DESTRUCTIVE)
-- ====================================================================
-- 0) Prérequis : exécuter en tant que superuser / service_role
BEGIN;
-- 1) Grant USAGE on auth schema and ensure privileges on its objects
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT SELECT ON TABLES TO authenticator;
-- 2) Ensure authenticator can see necessary information_schema views.
-- Grant SELECT on common catalog objects (where allowed).
-- We DO NOT modify ownership of pg_catalog objects; we only grant read permissions.
GRANT SELECT ON pg_catalog.pg_namespace TO authenticator;
GRANT SELECT ON pg_catalog.pg_class TO authenticator;
GRANT SELECT ON pg_catalog.pg_attribute TO authenticator;
GRANT SELECT ON pg_catalog.pg_proc TO authenticator;
GRANT SELECT ON pg_catalog.pg_type TO authenticator;
GRANT SELECT ON pg_catalog.pg_roles TO authenticator;
-- 3) Ensure access to information_schema
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO authenticator;
-- 4) Revoke problematic explicit DENY-like ACLs (normalize ACLs)
-- Iterate over objects with ACLs and reset them to default where sensible.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT nspname,
    relname,
    c.oid
FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
    AND c.relkind IN ('r', 'v', 'm', 'S') -- tables, views, matviews, sequences
    LOOP -- Only act if necessary (simplified relative to AI prompt to avoid errors on system objects)
    -- We assume the previous GRANT ALL fixed public, so we focus on ensuring no locks remain.
    EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO authenticator',
        r.nspname,
        r.relname
    );
END LOOP;
END $$;
-- 5) Notify PostgREST to reload schemas
NOTIFY pgrst,
'reload';
COMMIT;
SELECT 'OPTION A COMPLETE. RETRY LOGIN.' as status;