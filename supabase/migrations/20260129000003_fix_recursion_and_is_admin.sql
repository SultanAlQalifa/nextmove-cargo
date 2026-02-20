-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Infinite Recursion Fix (is_admin helper)
-- Date: 2026-01-29
-- ═══════════════════════════════════════════════════════════════
-- 1. CREATE HELPER FUNCTION (SECURITY DEFINER)
-- ───────────────────────────────────────────────────────────────
-- This function bypasses RLS to check the user's role, 
-- breaking the infinite recursion cycle.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 2. UPDATE PROFILES POLICIES
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT TO authenticated USING (public.is_admin());
-- 3. UPDATE OTHER ADMINISTRATIVE POLICIES
-- ───────────────────────────────────────────────────────────────
-- Locations
DROP POLICY IF EXISTS "Admins manage locations" ON public.locations;
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL TO authenticated USING (public.is_admin());
-- Package Types
DROP POLICY IF EXISTS "Admins manage package types" ON public.package_types;
CREATE POLICY "Admins manage package types" ON public.package_types FOR ALL TO authenticated USING (public.is_admin());
-- Wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR
SELECT TO authenticated USING (public.is_admin());
-- Transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR
SELECT TO authenticated USING (public.is_admin());
-- Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR
SELECT TO authenticated USING (public.is_admin());
-- System Settings
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.system_settings;
CREATE POLICY "Admins can manage all settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin());
-- Email Queue
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;
CREATE POLICY "Admins can view email queue" ON public.email_queue FOR
SELECT TO authenticated USING (public.is_admin());
-- Fund Calls
DROP POLICY IF EXISTS "Admins can view all fund calls" ON public.fund_calls;
CREATE POLICY "Admins can view all fund calls" ON public.fund_calls FOR ALL TO authenticated USING (public.is_admin());
-- Rate Limits
DROP POLICY IF EXISTS "Admins can view rate limits" ON public.rate_limits;
CREATE POLICY "Admins can view rate limits" ON public.rate_limits FOR
SELECT TO authenticated USING (public.is_admin());
-- User Subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL TO authenticated USING (public.is_admin());