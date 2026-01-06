-- ====================================================================
-- ROLE MEMBERSHIP REPAIR (INFRASTRUCTURE FIX)
-- ====================================================================
BEGIN;
-- 1. RESTORE ROLE HIERARCHY
-- The 'authenticator' role MUST be a member of 'anon' and 'authenticated'
-- for PostgREST to switch roles correctly.
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
-- 2. RESTORE SCHEMA USAGE (Just in case)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
-- 3. DIAGNOSTIC: CHECK EXISTING MEMBERSHIPS
-- This will print the current memberships in the result message.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT r.rolname,
        ARRAY(
            SELECT b.rolname
            FROM pg_auth_members m
                JOIN pg_roles b ON (m.roleid = b.oid)
            WHERE m.member = r.oid
        ) as memberof
    FROM pg_roles r
    WHERE r.rolname = 'authenticator'
) LOOP RAISE NOTICE 'Authenticator memberships: %',
r.memberof;
END LOOP;
END $$;
-- 4. RELOAD
NOTIFY pgrst,
'reload config';
COMMIT;
SELECT 'ROLES REPAIRED. Try login now.' as status;