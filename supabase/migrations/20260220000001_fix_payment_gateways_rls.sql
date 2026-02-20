-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Fix Payment Gateways Config RLS
-- Date: 2026-02-20
-- ═══════════════════════════════════════════════════════════════

-- The table has RLS enabled but no policies. 
-- We allow admins to manage it and the application to read it (for processing payments).

DROP POLICY IF EXISTS "Admins can manage payment gateways" ON public.payment_gateways_config;
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways_config FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view active gateways" ON public.payment_gateways_config;
CREATE POLICY "Authenticated users can view active gateways" ON public.payment_gateways_config FOR SELECT TO authenticated USING (is_active = true);
