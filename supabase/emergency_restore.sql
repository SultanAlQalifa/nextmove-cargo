-- ====================================================================
-- EMERGENCY SERVICE RESTORATION: FIX AUTH & API ROLES
-- ====================================================================
BEGIN;
-- 1. FIX SUPABASE_AUTH_ADMIN (Used by GoTrue / Auth Service)
-- Ensure it can bypass RLS (Crucial for Auth Service)
ALTER ROLE supabase_auth_admin WITH BYPASSRLS NOINHERIT CREATEROLE LOGIN;
-- Ensure correct search path including catalogs
ALTER ROLE supabase_auth_admin
SET search_path = public,
    auth,
    pg_catalog;
-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA pg_catalog TO supabase_auth_admin;
GRANT USAGE ON SCHEMA information_schema TO supabase_auth_admin;
-- Grant massive access to auth tables
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
-- 2. FIX AUTHENTICATOR (Used by PostgREST / API)
-- Ensure standard config
ALTER ROLE authenticator WITH NOINHERIT LOGIN;
ALTER ROLE authenticator
SET search_path = public,
    auth,
    pg_catalog;
-- Re-apply grants just in case
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT USAGE ON SCHEMA pg_catalog TO authenticator;
GRANT USAGE ON SCHEMA information_schema TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO authenticator;
-- 3. FORCE CACHE FLUSH (The "Kick")
-- Create and drop a dummy object to force schema listeners to wake up
CREATE TABLE public.__force_schema_cache_refresh (id int);
DROP TABLE public.__force_schema_cache_refresh;
-- 4. NOTIFY SERVICES
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'SERVICE ROLES RESTORED & CACHE KICKED' as status;