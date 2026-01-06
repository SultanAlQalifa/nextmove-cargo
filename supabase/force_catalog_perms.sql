-- ====================================================================
-- SCHEMA ISOLATION & CATALOG PERMISSIONS
-- ====================================================================
BEGIN;
-- 1. FORCE SEARCH_PATH (Isolate Public)
-- We remove 'auth' and 'extensions' from the search path for the API user.
-- This forces PostgREST to look ONLY at 'public', bypassing potentially corrupt hidden schemas.
ALTER ROLE authenticator
SET search_path = public;
-- 2. GRANT EXPLICIT CATALOG ACCESS
-- Sometimes 'authenticator' loses implied access to system catalogs.
GRANT USAGE ON SCHEMA pg_catalog TO authenticator;
GRANT USAGE ON SCHEMA information_schema TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO authenticator;
-- 3. ENSURE PUBLIC IS ACCESSIBLE
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
-- 4. RELOAD
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'SCHEMA ISOLATED TO PUBLIC. CATALOGS GRANTED.' as status;