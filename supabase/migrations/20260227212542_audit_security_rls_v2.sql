-- ==============================================================================
-- 🔴 PHASE 1: CRITICAL SECURITY FIXES (RLS ENFORCEMENT) V2 (IDEMPOTENT)
-- Enforcing Row Level Security on all remaining unprotected tables.
-- ==============================================================================
-- Helper Function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 1. TICKETS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR
SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" ON public.tickets FOR
INSERT WITH CHECK (
        user_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets" ON public.tickets FOR
UPDATE USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
-- 2. TICKET MESSAGES
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON public.ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_messages.ticket_id
                AND user_id = auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.ticket_messages;
CREATE POLICY "Users can insert messages to their tickets" ON public.ticket_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_messages.ticket_id
                AND user_id = auth.uid()
        )
        OR public.is_admin()
    );
-- 3. INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR
SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.is_admin());
-- 4. TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.transactions;
CREATE POLICY "Users can view their own wallet transactions" ON public.transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.wallets
            WHERE id = transactions.wallet_id
                AND user_id = auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (public.is_admin());
-- 5. COUPONS AND USAGES
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR
SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own coupon usages" ON public.coupon_usages;
CREATE POLICY "Users can view their own coupon usages" ON public.coupon_usages FOR
SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can create coupon usages" ON public.coupon_usages;
CREATE POLICY "Users can create coupon usages" ON public.coupon_usages FOR
INSERT WITH CHECK (
        user_id = auth.uid()
        OR public.is_admin()
    );
-- 6. SYSTEM PLATFORM CONFIGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write system settings" ON public.system_settings;
CREATE POLICY "Admins can write system settings" ON public.system_settings FOR ALL USING (public.is_admin());
ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read fee configs" ON public.fee_configs;
CREATE POLICY "Anyone can read fee configs" ON public.fee_configs FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write fee configs" ON public.fee_configs;
CREATE POLICY "Admins can write fee configs" ON public.fee_configs FOR ALL USING (public.is_admin());
ALTER TABLE public.platform_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read platform rates" ON public.platform_rates;
CREATE POLICY "Anyone can read platform rates" ON public.platform_rates FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write platform rates" ON public.platform_rates;
CREATE POLICY "Admins can write platform rates" ON public.platform_rates FOR ALL USING (public.is_admin());
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read platform features" ON public.platform_features;
CREATE POLICY "Anyone can read platform features" ON public.platform_features FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write platform features" ON public.platform_features;
CREATE POLICY "Admins can write platform features" ON public.platform_features FOR ALL USING (public.is_admin());
-- 7. DOCUMENTS
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view documents" ON public.shipment_documents;
CREATE POLICY "Users can view documents" ON public.shipment_documents FOR
SELECT USING (
        uploaded_by = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can upload documents" ON public.shipment_documents;
CREATE POLICY "Users can upload documents" ON public.shipment_documents FOR
INSERT WITH CHECK (
        uploaded_by = auth.uid()
        OR public.is_admin()
    );
-- 8. SAVED QUOTES (Modified to not clash with 20251222000002_create_saved_quotes.sql)
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
-- We'll skip recreating saved_quotes policies as it has its own existing working ones from its initialization file.
-- 9. FORWARDER RATES
ALTER TABLE public.forwarder_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Forwarders manage their own rates" ON public.forwarder_rates;
CREATE POLICY "Forwarders manage their own rates" ON public.forwarder_rates FOR ALL USING (
    forwarder_id = auth.uid()
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can view active forwarder rates" ON public.forwarder_rates;
CREATE POLICY "Users can view active forwarder rates" ON public.forwarder_rates FOR
SELECT USING (true);
-- 10. STAFF ROLES
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read staff roles" ON public.staff_roles;
CREATE POLICY "Admins can read staff roles" ON public.staff_roles FOR
SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage staff roles" ON public.staff_roles;
CREATE POLICY "Admins can manage staff roles" ON public.staff_roles FOR ALL USING (public.is_admin());
-- 11. SUBSCRIPTIONS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read plans" ON public.subscription_plans;
CREATE POLICY "Users can read plans" ON public.subscription_plans FOR
SELECT USING (
        is_active = true
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL USING (public.is_admin());
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions FOR
SELECT USING (
        user_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.user_subscriptions FOR ALL USING (public.is_admin());
-- 12. PAYMENT GATEWAYS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read active gateways" ON public.payment_gateways;
CREATE POLICY "Users can read active gateways" ON public.payment_gateways FOR
SELECT USING (
        is_active = true
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins manage gateways" ON public.payment_gateways;
CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL USING (public.is_admin());
-- 13. PODS
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Forwarders manage their pods" ON public.pods;
CREATE POLICY "Forwarders manage their pods" ON public.pods FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM shipments
        WHERE id = pods.shipment_id
            AND forwarder_id = auth.uid()
    )
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Shippers can view pods" ON public.pods;
CREATE POLICY "Shippers can view pods" ON public.pods FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM shipments
            WHERE id = pods.shipment_id
                AND client_id = auth.uid()
        )
        OR public.is_admin()
    );
-- 14. POS TERMINALS & SESSIONS
ALTER TABLE public.pos_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage POS stations" ON public.pos_stations;
CREATE POLICY "Admins manage POS stations" ON public.pos_stations FOR ALL USING (public.is_admin());
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agents view their own POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents view their own POS sessions" ON public.pos_sessions FOR
SELECT USING (
        agent_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Agents create POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents create POS sessions" ON public.pos_sessions FOR
INSERT WITH CHECK (
        agent_id = auth.uid()
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Agents update their own POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents update their own POS sessions" ON public.pos_sessions FOR
UPDATE USING (
        agent_id = auth.uid()
        OR public.is_admin()
    );