-- Migration: Security Hardening - Payments and Internal Infrastructure
-- Description: Adds RLS policies to payments, transactions, and email_queue tables.
-- 1. PAYMENTS & TRANSACTIONS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR public.is_admin()
    );
-- 2. EMAIL QUEUE (Privacy)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
-- Only admins/system can see the email queue
DROP POLICY IF EXISTS "Admins can manage email queue" ON public.email_queue;
CREATE POLICY "Admins can manage email queue" ON public.email_queue FOR ALL TO authenticated USING (public.is_admin());
-- Users can only insert into email_queue (e.g. for contact forms if allowed), 
-- but we usually use Edge Functions for this.
-- For now, let's restrict it strictly to service_role or admin.
DROP POLICY IF EXISTS "System can view email queue" ON public.email_queue;
CREATE POLICY "System can view email queue" ON public.email_queue FOR
SELECT TO service_role USING (true);
-- 3. SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.system_settings;
CREATE POLICY "Allow public read access to settings" ON public.system_settings FOR
SELECT TO anon,
    authenticated USING (true);
DROP POLICY IF EXISTS "Allow only admins to modify settings" ON public.system_settings;
CREATE POLICY "Allow only admins to modify settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin());