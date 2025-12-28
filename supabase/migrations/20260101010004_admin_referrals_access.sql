-- Migration: Admin Access to Referrals Table
-- Allow admins and super-admins to view all referral records for the dashboard.
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR
SELECT USING (public.is_admin());