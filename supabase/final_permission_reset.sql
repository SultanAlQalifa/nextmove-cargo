-- ====================================================================
-- FINAL PERMISSION RESET & VIEW CLEANUP
-- ====================================================================
BEGIN;
-- 1. RESET PERMISSIONS (Fix "permission denied" or "schema" errors)
GRANT USAGE ON SCHEMA public TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres,
    anon,
    authenticated,
    service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres,
    anon,
    authenticated,
    service_role;
-- 2. ENSURE SEARCH PATH IS CORRECT
ALTER ROLE authenticator
SET search_path = public,
    auth,
    extensions;
-- 3. DROP BROKEN VIEWS (Aggressive Cleanup)
-- We iterate through all views and try to select from them.
-- If it fails, we drop the view immediately.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
) LOOP BEGIN EXECUTE format(
    'PERFORM 1 FROM %I.%I LIMIT 1',
    r.table_schema,
    r.table_name
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ DROPPING BROKEN VIEW: %.% (Error: %)',
r.table_schema,
r.table_name,
SQLERRM;
EXECUTE format(
    'DROP VIEW IF EXISTS %I.%I CASCADE',
    r.table_schema,
    r.table_name
);
END;
END LOOP;
END $$;
-- 4. ENSURE USER_ROLE ENUM IS VISIBLE
GRANT USAGE ON TYPE public.user_role TO anon,
    authenticated,
    service_role;
-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
COMMIT;
SELECT 'PERMISSIONS RESET & BROKEN VIEWS DROPPED.' as status;