-- Migration: Fix Infinite Recursion in RLS Policies
-- Problem: Policies on 'profiles' table were querying 'profiles' directly, causing a loop.
-- Solution: Use a SECURITY DEFINER function to check admin status (bypasses RLS).
-- 1. Create robust is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER is crucial here!
-- 2. Fix 'profiles' policy (The source of the recursion)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT USING (public.is_admin());
-- 3. Update 'point_history' policy (Best practice to use the function too)
DROP POLICY IF EXISTS "Admins can view all point history" ON public.point_history;
CREATE POLICY "Admins can view all point history" ON public.point_history FOR
SELECT USING (public.is_admin());
-- 4. Update 'referrals' policy if strict
-- (Optional, but ensures consistency)