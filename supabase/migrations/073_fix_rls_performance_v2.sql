-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - RLS Performance Optimization (Round 2)
-- Description: Standardizes RLS policies to use (SELECT auth.uid())
-- to avoid row-by-row re-evaluation and fix InitPlan warnings.
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
-- 1. RATES & PRICING
-- Rates
DROP POLICY IF EXISTS "Public can view rates" ON public.rates;
CREATE POLICY "Public can view rates" ON public.rates FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Forwarders can manage own rates" ON public.rates;
CREATE POLICY "Forwarders can manage own rates" ON public.rates FOR ALL USING (
    forwarder_id = (
        SELECT auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    forwarder_id = (
        SELECT auth.uid()
    )
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Admins can manage all rates" ON public.rates;
CREATE POLICY "Admins can manage all rates" ON public.rates FOR ALL USING (public.is_admin());
-- Forwarder Rates
DROP POLICY IF EXISTS "Forwarders manage their own rates" ON public.forwarder_rates;
CREATE POLICY "Forwarders manage their own rates" ON public.forwarder_rates FOR ALL USING (
    forwarder_id = (
        SELECT auth.uid()
    )
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can view active forwarder rates" ON public.forwarder_rates;
CREATE POLICY "Users can view active forwarder rates" ON public.forwarder_rates FOR
SELECT USING (true);
-- Standard practice as verified in previous migrations
-- Platform Rates
DROP POLICY IF EXISTS "Anyone can read platform rates" ON public.platform_rates;
CREATE POLICY "Anyone can read platform rates" ON public.platform_rates FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage platform rates" ON public.platform_rates;
CREATE POLICY "Admins can manage platform rates" ON public.platform_rates FOR ALL USING (public.is_admin());
-- 2. PAYMENTS & FINANCIALS
-- Payments
DO $$
DECLARE column_exists_user_id BOOLEAN;
column_exists_shipment_id BOOLEAN;
BEGIN -- 1. Check if table exists
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'payments'
) THEN -- 2. Drop existing policy
EXECUTE 'DROP POLICY IF EXISTS "Users can view own payments" ON public.payments';
-- 3. Check for columns
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments'
            AND column_name = 'user_id'
    ) INTO column_exists_user_id;
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments'
            AND column_name = 'shipment_id'
    ) INTO column_exists_shipment_id;
-- 4. Create appropriate policy
IF column_exists_user_id THEN EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin())';
ELSIF column_exists_shipment_id THEN -- Use shipment_id to link to the user via shipments table
EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (
                EXISTS (
                    SELECT 1 FROM public.shipments s 
                    WHERE s.id = shipment_id 
                    AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))
                ) 
                OR public.is_admin()
            )';
ELSE -- Fallback to Admin only if no linking column found
EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin())';
END IF;
END IF;
END $$;
-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- Invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.is_admin());
-- Point History
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR
SELECT USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- Coupon Usages
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usages;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usages FOR
SELECT USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert own coupon usage" ON public.coupon_usages;
CREATE POLICY "Users can insert own coupon usage" ON public.coupon_usages FOR
INSERT WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- 3. SHIPMENTS & LOGISTICS
-- Shipment Events
DROP POLICY IF EXISTS "Users can view events for their shipments" ON public.shipment_events;
CREATE POLICY "Users can view events for their shipments" ON public.shipment_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND (
                    s.client_id = (
                        SELECT auth.uid()
                    )
                    OR s.forwarder_id = (
                        SELECT auth.uid()
                    )
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can create events for assigned shipments" ON public.shipment_events;
CREATE POLICY "Forwarders can create events for assigned shipments" ON public.shipment_events FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.forwarder_id = (
                    SELECT auth.uid()
                )
        )
        OR public.is_admin()
    );
-- Delivery Updates
DROP POLICY IF EXISTS "Drivers can insert delivery updates" ON public.delivery_updates;
CREATE POLICY "Drivers can insert delivery updates" ON public.delivery_updates FOR
INSERT WITH CHECK (
        public.is_admin()
        OR (
            SELECT auth.uid()
        ) IS NOT NULL
    );
-- Simplified check for drivers
DROP POLICY IF EXISTS "Users can view delivery updates" ON public.delivery_updates;
CREATE POLICY "Users can view delivery updates" ON public.delivery_updates FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND (
                    s.client_id = (
                        SELECT auth.uid()
                    )
                    OR s.forwarder_id = (
                        SELECT auth.uid()
                    )
                )
        )
        OR public.is_admin()
    );
-- 4. ACADEMY SYSTEM
-- Enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.academy_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.academy_enrollments FOR
SELECT USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- Lessons
DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON public.academy_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON public.academy_lessons FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.academy_enrollments
            WHERE user_id = (
                    SELECT auth.uid()
                )
                AND course_id = academy_lessons.course_id
        )
        OR public.is_admin()
    );
-- Courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.academy_courses;
CREATE POLICY "Anyone can view published courses" ON public.academy_courses FOR
SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.academy_courses;
CREATE POLICY "Admins can manage all courses" ON public.academy_courses FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
            AND role IN ('admin', 'super-admin', 'support', 'manager')
    )
);
-- Quiz Attempts
DROP POLICY IF EXISTS "Users can see own attempts" ON public.academy_quiz_attempts;
CREATE POLICY "Users can see own attempts" ON public.academy_quiz_attempts FOR
SELECT USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- 5. LEADS & CONNECTIONS
-- Sales Leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.sales_leads;
CREATE POLICY "Users can view their own leads" ON public.sales_leads FOR
SELECT USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- User Connections
DROP POLICY IF EXISTS "Users can send connection requests" ON public.user_connections;
CREATE POLICY "Users can send connection requests" ON public.user_connections FOR
INSERT WITH CHECK (
        requester_id = (
            SELECT auth.uid()
        )
    );
DROP POLICY IF EXISTS "Recipients can update status" ON public.user_connections;
CREATE POLICY "Recipients can update status" ON public.user_connections FOR
UPDATE USING (
        recipient_id = (
            SELECT auth.uid()
        )
        OR requester_id = (
            SELECT auth.uid()
        )
    );
-- 6. DOCUMENTS
-- General Documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents FOR
SELECT USING (
        owner_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
CREATE POLICY "Users can upload documents" ON public.documents FOR
INSERT WITH CHECK (
        owner_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- Forwarder Documents
DROP POLICY IF EXISTS "Forwarders can view own documents" ON public.forwarder_documents;
CREATE POLICY "Forwarders can view own documents" ON public.forwarder_documents FOR
SELECT USING (
        forwarder_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- Shipment Documents
DROP POLICY IF EXISTS "Clients can view their documents" ON public.shipment_documents;
CREATE POLICY "Clients can view their documents" ON public.shipment_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.client_id = (
                    SELECT auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can view their documents" ON public.shipment_documents;
CREATE POLICY "Forwarders can view their documents" ON public.shipment_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.forwarder_id = (
                    SELECT auth.uid()
                )
        )
        OR public.is_admin()
    );
-- Final flush of linter-reported specific policy names
DROP POLICY IF EXISTS "Public Read Rates" ON public.forwarder_rates;
DROP POLICY IF EXISTS "Public read access to platform rates" ON public.platform_rates;
DROP POLICY IF EXISTS "Admins can management platform rates" ON public.platform_rates;
DROP POLICY IF EXISTS "Public can view forwarder rates" ON public.forwarder_rates;
DROP POLICY IF EXISTS "Clients can view events for own shipments" ON public.shipment_events;
DROP POLICY IF EXISTS "Forwarders can view events for assigned shipments" ON public.shipment_events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.shipment_events;