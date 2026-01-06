-- ====================================================================
-- NUCLEAR ISOLATION: FORCE LOGIN SUCCESS
-- ====================================================================
-- 1. DISABLE TRIGGER (Temporarily stop automatic profile creation)
-- If login works after this, the trigger is 100% the cause.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 2. DISABLE RLS ON PROFILES (Temporarily stop all permission checks)
-- If login works, the issue was an RLS policy loop.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- 3. GRANT PERMISSIONS ON TYPES (Fix "querying schema" errors)
-- Ensure PostgREST can actually read the ENUM types.
GRANT USAGE ON SCHEMA public TO anon,
    authenticated,
    service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,
    authenticated,
    service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon,
    authenticated,
    service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon,
    authenticated,
    service_role;
-- 4. RELOAD SCHEMA
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'NUCLEAR MODE ACTIVE: Trigger dropped, RLS disabled. Login MUST work now.' as status;