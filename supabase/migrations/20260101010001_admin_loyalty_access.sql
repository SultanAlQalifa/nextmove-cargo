-- Migration: Enable Admin Access to Point History & Profiles
-- 1. Policy for Point History (Admins see all)
DROP POLICY IF EXISTS "Admins can view all point history" ON public.point_history;
CREATE POLICY "Admins can view all point history" ON public.point_history FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
-- 2. Ensure Admins can search profiles (if not already covered)
-- Usually profiles are readable by authenticated users, but let's ensure admins can read sensitive fields if needed.
-- Existing policies likely cover basic read. We'll add a specific one just in case.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );