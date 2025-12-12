-- ═══════════════════════════════════════════════════════════════
-- FIX INFINITE RECURSION IN PROFILES RLS
-- ═══════════════════════════════════════════════════════════════
-- 1. Create a helper function to get the current user's role SAFELY.
-- SECURITY DEFINER allows this function to bypass RLS, avoiding the recursion loop 
-- where checking permissions requires checking permissions.
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
SELECT role
FROM profiles
WHERE id = auth.uid();
$$;
-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Strict Profile Visibility" ON profiles;
-- 3. Recreate the policy using the safe function
CREATE POLICY "Strict Profile Visibility" ON profiles FOR
SELECT USING (
        id = auth.uid() -- Self always sees self
        OR (
            -- Admins see all (Safe check using Security Definer)
            get_my_role() IN ('admin', 'super-admin')
        )
        OR (
            -- Forwarders see their assigned clients (or all clients for now as per previous logic)
            get_my_role() = 'forwarder'
            AND role = 'client'
        )
    );
-- 4. Also fix other policies that might rely on recursive checks (just in case)
-- (Re-applying the admin write policies with the safe function if needed, 
-- but usually is_admin() was used there. Let's make sure is_admin is also safe if it exists).
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
SELECT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    );
$$;