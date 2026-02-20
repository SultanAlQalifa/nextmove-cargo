-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Security Remediation Migration
-- Date: 2026-01-29
-- ═══════════════════════════════════════════════════════════════
-- 1. RE-ENABLE RLS ON ALL TABLES (Proactive safety)
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
) LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
END LOOP;
END $$;
-- 2. TIGHTEN USER SUBSCRIPTIONS (Previously Disabled)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR
SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);
-- 3. SECURE EMAIL QUEUE (Restrict Public Access)
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable read for everyone" ON public.email_queue;
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;
CREATE POLICY "Admins can view email queue" ON public.email_queue FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );
-- 4. TIGHTEN PROFILES VISIBILITY
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR
SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public can view active forwarders" ON public.profiles;
CREATE POLICY "Public can view active forwarders" ON public.profiles FOR
SELECT TO public USING (
        role = 'forwarder'::user_role
        AND account_status = 'active'
    );
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );
-- 5. REINFORCE WALLET & TRANSACTION ISOLATION
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR
SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.wallets
            WHERE wallets.id = transactions.wallet_id
                AND wallets.user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );
-- 6. AUDIT LOGS SECURITY
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );
-- 7. SYSTEM SETTINGS & SECRETS
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Public can view non-sensitive settings" ON public.system_settings FOR
SELECT TO public USING (is_secret = false);
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.system_settings;
CREATE POLICY "Admins can manage all settings" ON public.system_settings FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);