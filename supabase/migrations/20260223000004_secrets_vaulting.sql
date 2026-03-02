-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - GLOBAL SECURITY HARDENING (VAULTING SECRETS)
-- Date: 2026-02-23
-- ═══════════════════════════════════════════════════════════════
-- 1. PREVENT PUBLIC LEAKAGE OF PAYMENT GATEWAY CONFIGS
-- Authenticated users (clients/forwarders) should NOT see the secret_key or any config.
-- This is critical as RLS was previously too permissive.
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage gateways" ON public.payment_gateways;
CREATE POLICY "Admins can manage gateways" ON public.payment_gateways FOR ALL TO authenticated USING (public.is_admin());
-- Remove any public/authenticated SELECT access from payment_gateways
DROP POLICY IF EXISTS "Users can view active gateways" ON public.payment_gateways;
-- Note: Edge Functions (using SERVICE_ROLE) will still be able to read this table to process payments.
-- 2. LOCK DOWN ANY OTHER SENSITIVE TABLES
-- Ensure system_secrets is strictly accessible by admins only (already done in 052 but re-enforcing)
ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage secrets" ON public.system_secrets;
CREATE POLICY "Admins can manage secrets" ON public.system_secrets FOR ALL TO authenticated USING (public.is_admin());
-- 3. SANITIZE OLD POLICIES
DROP POLICY IF EXISTS "Authenticated users can view active gateways" ON public.payment_gateways_config;
CREATE POLICY "Admins can manage gateways config" ON public.payment_gateways_config FOR ALL TO authenticated USING (public.is_admin());
-- 4. FINAL CLEANUP: Ensure no sensitive data in system_settings
DELETE FROM public.system_settings
WHERE key IN (
        'openai_api_key',
        'sendgrid_key',
        'stripe_secret',
        'wave_token'
    );