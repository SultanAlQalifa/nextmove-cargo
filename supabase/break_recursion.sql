-- ====================================================================
-- RECURSION BREAKER: SWITCH TO AUTH METADATA
-- ====================================================================
-- 1. FIX get_my_role (Breaks Recursion)
-- Instead of querying public.profiles (which triggers RLS -> is_admin -> profiles),
-- we query auth.users directly. This requires SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$ -- JSONB accessor is faster and bypasses RLS on public tables
SELECT COALESCE(raw_user_meta_data->>'role', 'client')
FROM auth.users
WHERE id = auth.uid();
$$;
-- 2. FIX is_admin (Breaks Recursion)
-- Same logic: Check metadata directly.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
SELECT COALESCE(raw_user_meta_data->>'role', '') IN ('admin', 'super-admin')
FROM auth.users
WHERE id = auth.uid();
$$;
-- 3. ENSURE METADATA SYNC (Safety Net)
-- We ensure the trigger copies data back to metadata if it's missing, 
-- though handle_new_user usually does the opposite (metadata -> profile).
-- This step is just to re-affirm the trigger logic we already fixed.
-- (No action needed as handle_new_user v4 already covers this).
-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'RECURSION BROKEN. Metadata-based auth active.' as status;