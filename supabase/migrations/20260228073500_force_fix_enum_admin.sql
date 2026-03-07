-- Comprehensive fix to clear 'super_admin' references and use 'admin'
-- This script corrects the 'super_admin' issue for the 'user_role' enum.
-- 1. Correct the 'is_admin' function to stop using 'super_admin'
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (select auth.uid())
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Drop policies that might use 'super_admin'
DROP POLICY IF EXISTS "Forwarders can update their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Forwarders can delete their own pending shipments" ON public.shipments;
-- Recreate policies correctly without 'super_admin'
CREATE POLICY "Forwarders can update their own shipments" ON public.shipments FOR
UPDATE USING (
        forwarder_id = (select auth.uid())
        OR public.is_admin()
    );
CREATE POLICY "Forwarders can delete their own pending shipments" ON public.shipments FOR DELETE USING (
    (
        forwarder_id = (select auth.uid())
        AND status = 'pending'
    )
    OR public.is_admin()
);
-- 3. In profiles, if any trigger checks 'super_admin', the simplest solution is handled above.
-- Notify user that this script should be run in Supabase SQL Editor.