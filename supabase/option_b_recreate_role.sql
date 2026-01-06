-- ====================================================================
-- OPTION B: RECREATE AUTHENTICATOR ROLE (DESTRUCTIVE/INTRUSIVE)
-- ====================================================================
-- WARNING: Ensure you have a backup before running this.
-- This script drops and recreates the system role responsible for API access.
BEGIN;
-- 0. SAFEGUARD: Create temp role to hold ownerships
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'authenticator_repair'
) THEN CREATE ROLE authenticator_repair NOLOGIN;
RAISE NOTICE 'Created temp role information_repair';
END IF;
END $$;
-- 1. TRANSFER OWNERSHIP (Evacuate 'authenticator')
-- We move everything owned by 'authenticator' to 'authenticator_repair'
DO $$
DECLARE obj RECORD;
BEGIN -- Tables/Views/Sequences
FOR obj IN
SELECT quote_ident(nspname) AS schema,
    quote_ident(relname) AS relname
FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE pg_get_userbyid(c.relowner) = 'authenticator' LOOP EXECUTE format(
        'ALTER TABLE %s.%s OWNER TO authenticator_repair',
        obj.schema,
        obj.relname
    );
END LOOP;
-- Functions
FOR obj IN
SELECT n.nspname,
    p.proname,
    oidvectortypes(p.proargtypes) as args
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_userbyid(p.proowner) = 'authenticator' LOOP EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) OWNER TO authenticator_repair',
        obj.nspname,
        obj.proname,
        obj.args
    );
END LOOP;
END $$;
-- 2. CAPTURE MEMBERSHIPS
CREATE TEMP TABLE IF NOT EXISTS tmp_auth_members AS
SELECT pg_get_userbyid(m.roleid) AS role_name
FROM pg_auth_members m
    JOIN pg_roles r ON m.member = r.oid
WHERE r.rolname = 'authenticator';
-- 3. DROP AND RECREATE
DROP ROLE IF EXISTS authenticator;
CREATE ROLE authenticator NOLOGIN NOINHERIT;
-- Default Supabase config
GRANT authenticator TO postgres;
-- Ensure postgres can manage it
-- 4. RESTORE MEMBERSHIPS
-- Restore captured memberships
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT role_name
FROM tmp_auth_members LOOP IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = r.role_name
    ) THEN EXECUTE format('GRANT %I TO authenticator', r.role_name);
END IF;
END LOOP;
-- Ensure critical standard memberships exist
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
END $$;
-- 5. RESTORE OWNERSHIP (Repatriate objects)
DO $$
DECLARE obj RECORD;
BEGIN -- Tables
FOR obj IN
SELECT quote_ident(nspname) AS schema,
    quote_ident(relname) AS relname
FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE pg_get_userbyid(c.relowner) = 'authenticator_repair' LOOP EXECUTE format(
        'ALTER TABLE %s.%s OWNER TO authenticator',
        obj.schema,
        obj.relname
    );
END LOOP;
-- Functions
FOR obj IN
SELECT n.nspname,
    p.proname,
    oidvectortypes(p.proargtypes) as args
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_userbyid(p.proowner) = 'authenticator_repair' LOOP EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) OWNER TO authenticator',
        obj.nspname,
        obj.proname,
        obj.args
    );
END LOOP;
END $$;
-- 6. CLEANUP TEMP ROLE
DROP ROLE IF EXISTS authenticator_repair;
DROP TABLE IF EXISTS tmp_auth_members;
-- 7. RE-APPLY PERMISSIONS (The Fix)
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO authenticator;
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;
-- 8. RELOAD
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'AUTHENTICATOR RECREATED. RETRY LOGIN.' as status;