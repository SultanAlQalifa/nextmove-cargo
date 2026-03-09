-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - RLS Consolidation & Redundancy Cleanup (Phase 8)
-- Description: Unifies redundant policies and optimizes performance
-- using (SELECT auth.uid()) for all linter-reported issues.
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
-- 1. ACADEMY SYSTEM (Consolidation of Multiple Permissive Policies)
-- academy_courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.academy_courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.academy_courses;
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.academy_courses;
DROP POLICY IF EXISTS "View published courses" ON public.academy_courses;
CREATE POLICY "Anyone can view published courses" ON public.academy_courses FOR
SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all courses" ON public.academy_courses FOR ALL USING (public.is_admin());
-- academy_enrollments
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.academy_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.academy_enrollments;
DROP POLICY IF EXISTS "View own enrollment" ON public.academy_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.academy_enrollments FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Admins can manage all enrollments" ON public.academy_enrollments FOR ALL TO authenticated USING (public.is_admin());
-- academy_lessons
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.academy_lessons;
DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON public.academy_lessons;
DROP POLICY IF EXISTS "Users can view lessons of enrolled courses" ON public.academy_lessons;
DROP POLICY IF EXISTS "View lessons of published courses" ON public.academy_lessons;
DROP POLICY IF EXISTS "Lessons are viewable by enrolled students" ON public.academy_lessons;
CREATE POLICY "Students can view lessons of enrolled courses" ON public.academy_lessons FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.academy_enrollments e
            WHERE e.course_id = academy_lessons.course_id
                AND e.user_id = (
                    SELECT auth.uid()
                )
        )
        OR public.is_admin()
    );
CREATE POLICY "Admins can manage all lessons" ON public.academy_lessons FOR ALL TO authenticated USING (public.is_admin());
-- academy_lesson_comments
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Logged users can comment" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Users can comment on lessons" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Anyone can read comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Anyone can see lesson comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Users can edit their own comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Users or admins can delete comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.academy_lesson_comments;
DROP POLICY IF EXISTS "Users can manage own comments" ON public.academy_lesson_comments;
CREATE POLICY "Anyone can view comments" ON public.academy_lesson_comments FOR
SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.academy_lesson_comments FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can manage own comments" ON public.academy_lesson_comments FOR ALL TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
    OR public.is_admin()
);
-- academy_quiz_attempts
DROP POLICY IF EXISTS "Users can see own attempts" ON public.academy_quiz_attempts;
DROP POLICY IF EXISTS "Users view own attempts" ON public.academy_quiz_attempts;
CREATE POLICY "Users can view own attempts" ON public.academy_quiz_attempts FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- academy_quiz_questions/options
DROP POLICY IF EXISTS "Anyone can see questions" ON public.academy_quiz_questions;
DROP POLICY IF EXISTS "Questions viewable by all" ON public.academy_quiz_questions;
DROP POLICY IF EXISTS "Anyone can see options" ON public.academy_quiz_options;
DROP POLICY IF EXISTS "Options viewable by all" ON public.academy_quiz_options;
CREATE POLICY "Anyone can view quiz content" ON public.academy_quiz_questions FOR
SELECT USING (true);
CREATE POLICY "Anyone can view quiz options" ON public.academy_quiz_options FOR
SELECT USING (true);
-- 2. PAYMENTS & FINANCIALS (Optimized InitPlan)
-- payments (Dynamic check)
DO $$
DECLARE column_exists_user_id BOOLEAN;
column_exists_shipment_id BOOLEAN;
BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'payments'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments';
EXECUTE 'DROP POLICY IF EXISTS "Forwarders can view payments for their shipments" ON public.payments';
EXECUTE 'DROP POLICY IF EXISTS "Clients can create payments" ON public.payments';
EXECUTE 'DROP POLICY IF EXISTS "Users can view own payments" ON public.payments';
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
IF column_exists_user_id THEN EXECUTE 'CREATE POLICY "Users can manage own payments" ON public.payments FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_admin())';
ELSIF column_exists_shipment_id THEN EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (
                EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))) OR public.is_admin()
            )';
EXECUTE 'CREATE POLICY "Users can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true)';
END IF;
END IF;
END $$;
-- wallets
DROP POLICY IF EXISTS "Secure Wallet Access" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- transactions
DROP POLICY IF EXISTS "view_transactions_policy" ON public.transactions;
DROP POLICY IF EXISTS "create_transactions_policy" ON public.transactions;
DROP POLICY IF EXISTS "Secure Transaction Access" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- 3. SHIPMENTS & TICKETS (Consistency fixes)
-- shipments
DROP POLICY IF EXISTS "view_shipments_policy" ON public.shipments;
DROP POLICY IF EXISTS "create_shipments_policy" ON public.shipments;
DROP POLICY IF EXISTS "update_shipments_policy" ON public.shipments;
DROP POLICY IF EXISTS "Forwarders_Update_Policy" ON public.shipments;
DROP POLICY IF EXISTS "Forwarders_Delete_Policy" ON public.shipments;
DROP POLICY IF EXISTS "Users can view relevant shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update relevant shipments" ON public.shipments;
CREATE POLICY "Users can view relevant shipments" ON public.shipments FOR
SELECT TO authenticated USING (
        client_id = (
            SELECT auth.uid()
        )
        OR forwarder_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Users can create shipments" ON public.shipments FOR
INSERT TO authenticated WITH CHECK (
        client_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Users can update relevant shipments" ON public.shipments FOR
UPDATE TO authenticated USING (
        client_id = (
            SELECT auth.uid()
        )
        OR forwarder_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- tickets
DROP POLICY IF EXISTS "view_tickets_policy" ON public.tickets;
DROP POLICY IF EXISTS "create_tickets_policy" ON public.tickets;
DROP POLICY IF EXISTS "update_tickets_policy" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Users can create tickets" ON public.tickets FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- ticket_messages
DROP POLICY IF EXISTS "Users can send messages to their tickets" ON public.ticket_messages;
CREATE POLICY "Users can manage ticket messages" ON public.ticket_messages FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.id = ticket_id
            AND t.user_id = (
                SELECT auth.uid()
            )
    )
    OR public.is_admin()
);
-- 4. PROFILE & MISC
-- profiles
DROP POLICY IF EXISTS "Profiles_Read_Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Update_Policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (
        id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (
        id = (
            SELECT auth.uid()
        )
        OR public.is_admin()
    );
-- locations & package_types (Admin/Auth cleanup)
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;
DROP POLICY IF EXISTS "Admins manage locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
CREATE POLICY "Anyone can view locations" ON public.locations FOR
SELECT USING (true);
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can insert package types" ON public.package_types;
DROP POLICY IF EXISTS "Authenticated users can update package types" ON public.package_types;
DROP POLICY IF EXISTS "Authenticated users can delete package types" ON public.package_types;
DROP POLICY IF EXISTS "Admins manage package types" ON public.package_types;
DROP POLICY IF EXISTS "Anyone can view package types" ON public.package_types;
CREATE POLICY "Anyone can view package types" ON public.package_types FOR
SELECT USING (true);
CREATE POLICY "Admins manage package types" ON public.package_types FOR ALL USING (public.is_admin());
-- documents
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents FOR ALL TO authenticated USING (
    owner_id = (
        SELECT auth.uid()
    )
    OR public.is_admin()
);
-- FINAL FLUSH (Batch renaming linter-reported specific policy names)
DROP POLICY IF EXISTS "Forwarders can add clients" ON public.forwarder_clients_backup;
DROP POLICY IF EXISTS "Forwarders can remove clients" ON public.forwarder_clients_backup;
DROP POLICY IF EXISTS "Forwarders can manage their own addresses" ON public.forwarder_addresses;
DROP POLICY IF EXISTS "Owner can always manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can view their own shipment events" ON public.shipment_events;
DROP POLICY IF EXISTS "Relevant users can insert events" ON public.shipment_events;
DROP POLICY IF EXISTS "Users can update their own consolidations" ON public.consolidations;
DROP POLICY IF EXISTS "Users can delete their own consolidations" ON public.consolidations;
DROP POLICY IF EXISTS "Authenticated users can insert consolidations" ON public.consolidations;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Admins can manage fees" ON public.fee_configs;
DROP POLICY IF EXISTS "Admins can manage secrets" ON public.system_secrets;
DROP POLICY IF EXISTS "Admins can view all PODs" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Clients can view PODs for own shipments" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Forwarders can manage PODs for assigned shipments" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "User view own quotes" ON public.saved_quotes;
DROP POLICY IF EXISTS "Users can view own saved quotes" ON public.saved_quotes;
DROP POLICY IF EXISTS "Admins can view debug logs" ON public.debug_logs;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Forwarders can upload documents" ON public.shipment_documents;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Drivers insert updates" ON public.delivery_updates;
DROP POLICY IF EXISTS "Admins can view all operations" ON public.pos_cash_operations;
DROP POLICY IF EXISTS "Admins and Managers can update operation status" ON public.pos_cash_operations;
DROP POLICY IF EXISTS "Users can insert operations in their open sessions" ON public.pos_cash_operations;
DROP POLICY IF EXISTS "Users view own attempts" ON public.academy_quiz_attempts;
DROP POLICY IF EXISTS "Authenticated users can review courses" ON public.academy_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.academy_reviews;
DROP POLICY IF EXISTS "Users or admins can delete reviews" ON public.academy_reviews;
DROP POLICY IF EXISTS "Users view own loyalty" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Authenticated users can like lessons" ON public.academy_lesson_likes;
DROP POLICY IF EXISTS "Users can unlike lessons" ON public.academy_lesson_likes;
-- Re-apply some specific ones optimized
CREATE POLICY "Admins can manage all PODs" ON public.proof_of_delivery FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view their own shipment events" ON public.shipment_events FOR
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