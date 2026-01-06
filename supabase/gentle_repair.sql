-- ====================================================================
-- GENTLE REPAIR: GRANTS ONLY (No ALTER ROLE)
-- ====================================================================
BEGIN;
-- 1. Ensure supabase_auth_admin can USE the schemas (Usage)
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA pg_catalog TO supabase_auth_admin;
GRANT USAGE ON SCHEMA information_schema TO supabase_auth_admin;
-- 2. Ensure supabase_auth_admin can READ/WRITE Auth Tables
-- We use GRANT ALL to be sure, but only on tables, sequences, routines
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
-- 3. Ensure supabase_auth_admin can READ System Catalogs
-- Crucial for "querying schema" errors
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO supabase_auth_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO supabase_auth_admin;
-- 4. Double-Check Authenticator (API) as well (Permissions only)
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO authenticator;
-- 5. DIAGNOSTIC: Check triggers on auth.users (Hidden blockers?)
SELECT tgname,
    tgenabled,
    tgrelid::regclass
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
COMMIT;
SELECT 'GENTLE PERMISSIONS GRANTED' as status;