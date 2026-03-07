-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Final RLS Optimization & Consolidation (Phase 10 - V3)
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
-- 1. DYNAMIC OPTIMIZATION BLOCK
-- This block handles auth_rls_initplan and missing column checks
DO $$ BEGIN -- 1.1 Shipments
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'shipments'
) THEN DROP POLICY IF EXISTS "Forwarders can update their own shipments" ON public.shipments;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'forwarder_id'
) THEN EXECUTE 'CREATE POLICY "Forwarders can update their own shipments" ON public.shipments 
                     FOR UPDATE TO authenticated USING (forwarder_id = (SELECT auth.uid()) OR public.is_admin())';
END IF;
END IF;
-- 1.2 Quote Requests
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'quote_requests'
) THEN DROP POLICY IF EXISTS "create_quote_requests_policy" ON public.quote_requests;
DROP POLICY IF EXISTS "view_quote_requests_policy" ON public.quote_requests;
DROP POLICY IF EXISTS "Users can insert quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Clients can view own requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Forwarders can view all pending requests" ON public.quote_requests;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quote_requests'
        AND column_name = 'client_id'
) THEN EXECUTE 'CREATE POLICY "Users can create quote requests" ON public.quote_requests 
                     FOR INSERT TO authenticated WITH CHECK (client_id = (SELECT auth.uid()) OR public.is_admin())';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quote_requests'
        AND column_name = 'client_id'
)
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quote_requests'
        AND column_name = 'forwarder_id'
) THEN EXECUTE 'CREATE POLICY "Users can view quote requests" ON public.quote_requests 
                     FOR SELECT TO authenticated USING (client_id = (SELECT auth.uid()) OR forwarder_id = (SELECT auth.uid()) OR public.is_admin())';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quote_requests'
        AND column_name = 'client_id'
) THEN EXECUTE 'CREATE POLICY "Users can view quote requests" ON public.quote_requests 
                     FOR SELECT TO authenticated USING (client_id = (SELECT auth.uid()) OR public.is_admin())';
END IF;
END IF;
-- 1.3 Quotes
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'quotes'
) THEN DROP POLICY IF EXISTS "create_quotes_policy" ON public.quotes;
DROP POLICY IF EXISTS "view_quotes_policy" ON public.quotes;
DROP POLICY IF EXISTS "Forwarders can manage own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Clients can view quotes for their requests" ON public.quotes;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
        AND column_name = 'forwarder_id'
) THEN EXECUTE 'CREATE POLICY "Forwarders can manage own quotes" ON public.quotes 
                     FOR ALL TO authenticated USING (forwarder_id = (SELECT auth.uid()) OR public.is_admin())';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
        AND column_name = 'quote_request_id'
) THEN EXECUTE 'CREATE POLICY "Clients can view quotes" ON public.quotes 
                     FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quote_requests r WHERE r.id = quote_request_id AND r.client_id = (SELECT auth.uid())) OR public.is_admin())';
END IF;
END IF;
-- 1.4 PODs
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'pods'
) THEN DROP POLICY IF EXISTS "Forwarders can create PODs" ON public.pods;
DROP POLICY IF EXISTS "Forwarders/Clients can view related PODs" ON public.pods;
DROP POLICY IF EXISTS "Forwarders manage their pods" ON public.pods;
DROP POLICY IF EXISTS "Shippers can view pods" ON public.pods;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pods'
        AND column_name = 'forwarder_id'
) THEN EXECUTE 'CREATE POLICY "Forwarders manage own pods" ON public.pods 
                     FOR ALL TO authenticated USING (forwarder_id = (SELECT auth.uid()) OR public.is_admin())';
EXECUTE 'CREATE POLICY "Relevant users can view pods" ON public.pods 
                     FOR SELECT TO authenticated USING (forwarder_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()))) OR public.is_admin())';
END IF;
END IF;
-- 1.5 Chats
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'chats'
) THEN DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'chats'
        AND column_name = 'user_id'
) THEN EXECUTE 'CREATE POLICY "Users can create chats" ON public.chats 
                     FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin())';
END IF;
END IF;
-- 1.6 Blog Posts (Dynamic status check)
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'blog_posts'
) THEN DROP POLICY IF EXISTS "Admin manage blog" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public read blog" ON public.blog_posts;
EXECUTE 'CREATE POLICY "Admin manage blog" ON public.blog_posts FOR ALL USING (public.is_admin())';
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'blog_posts'
        AND column_name = 'status'
) THEN EXECUTE 'CREATE POLICY "Public read blog" ON public.blog_posts FOR SELECT USING (status = ''published'')';
ELSE EXECUTE 'CREATE POLICY "Public read blog" ON public.blog_posts FOR SELECT USING (true)';
END IF;
END IF;
-- 1.7 System Settings (Dynamic is_sensitive check)
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'system_settings'
) THEN DROP POLICY IF EXISTS "Admins can write system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
EXECUTE 'CREATE POLICY "Admins manage system settings" ON public.system_settings FOR ALL USING (public.is_admin())';
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'system_settings'
        AND column_name = 'is_sensitive'
) THEN EXECUTE 'CREATE POLICY "Public view system settings" ON public.system_settings FOR SELECT USING (NOT is_sensitive)';
ELSE EXECUTE 'CREATE POLICY "Public view system settings" ON public.system_settings FOR SELECT USING (true)';
END IF;
END IF;
END $$;
-- 2. MASSIVE CONSOLIDATION (Simplified)
-- Academy Systems
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.academy_reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON public.academy_reviews;
CREATE POLICY "Anyone can view reviews" ON public.academy_reviews FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can view delivery updates" ON public.delivery_updates;
DROP POLICY IF EXISTS "Users view updates" ON public.delivery_updates;
CREATE POLICY "Users can view delivery updates" ON public.delivery_updates FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Public read active faqs" ON public.faqs;
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (public.is_admin());
CREATE POLICY "Public read faqs" ON public.faqs FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can write fee configs" ON public.fee_configs;
DROP POLICY IF EXISTS "Admins manage fees" ON public.fee_configs;
DROP POLICY IF EXISTS "Anyone can read fee configs" ON public.fee_configs;
DROP POLICY IF EXISTS "Public read access to fees" ON public.fee_configs;
CREATE POLICY "Admins manage fees" ON public.fee_configs FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can read fees" ON public.fee_configs FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings" ON public.platform_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Public view platform settings" ON public.platform_settings FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage platform rates" ON public.platform_rates;
DROP POLICY IF EXISTS "Admins can write platform rates" ON public.platform_rates;
DROP POLICY IF EXISTS "Anyone can read platform rates" ON public.platform_rates;
CREATE POLICY "Admins manage platform rates" ON public.platform_rates FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can read platform rates" ON public.platform_rates FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage features" ON public.platform_features;
DROP POLICY IF EXISTS "Admins can write platform features" ON public.platform_features;
DROP POLICY IF EXISTS "Anyone can read platform features" ON public.platform_features;
DROP POLICY IF EXISTS "Public read access to features" ON public.platform_features;
CREATE POLICY "Admins manage features" ON public.platform_features FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can read features" ON public.platform_features FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public read access to plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can read plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL USING (public.is_admin());
CREATE POLICY "Public view plans" ON public.subscription_plans FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Public Read Locations" ON public.locations;
DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;
DROP POLICY IF EXISTS "Public read access to locations" ON public.locations;
DROP POLICY IF EXISTS "Public view active" ON public.locations;
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL USING (public.is_admin());
CREATE POLICY "Public view locations" ON public.locations FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage package types" ON public.package_types;
DROP POLICY IF EXISTS "Anyone can view package types" ON public.package_types;
DROP POLICY IF EXISTS "Public Read Package Types" ON public.package_types;
DROP POLICY IF EXISTS "Public can view active package types" ON public.package_types;
DROP POLICY IF EXISTS "Public view active pkg" ON public.package_types;
CREATE POLICY "Admins manage package types" ON public.package_types FOR ALL USING (public.is_admin());
CREATE POLICY "Public view package types" ON public.package_types FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Owner can always manage gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Users can read active gateways" ON public.payment_gateways;
CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL USING (public.is_admin());
CREATE POLICY "Public view gateways" ON public.payment_gateways FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public read active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (public.is_admin());
CREATE POLICY "Public read testimonials" ON public.testimonials FOR
SELECT USING (true);