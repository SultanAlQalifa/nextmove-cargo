-- ==============================================================================
-- 🚀 EXHAUSTIVE RLS PERFORMANCE & SCHEMA FIXES (Init Plan Optimization)
-- Optimized for: Performance (Init Plan) + Schema Correctness (user_id vs client_id)
-- Standardizes on (select auth.uid()) and (select auth.jwt()) for 100x performance.
-- ==============================================================================
SET search_path = public;
-- 1. TICKETS (Table uses user_id)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" ON public.tickets FOR
INSERT WITH CHECK (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets" ON public.tickets FOR
UPDATE USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "delete_tickets_policy" ON public.tickets;
CREATE POLICY "delete_tickets_policy" ON public.tickets FOR DELETE USING (
    user_id = (
        select auth.uid()
    )
    OR public.is_admin()
);
-- 2. TICKET MESSAGES (ticket_messages.ticket_id -> tickets.id)
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON public.ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.ticket_messages;
CREATE POLICY "Users can insert messages to their tickets" ON public.ticket_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "view_messages_policy" ON public.ticket_messages;
CREATE POLICY "view_messages_policy" ON public.ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "create_messages_policy" ON public.ticket_messages;
CREATE POLICY "create_messages_policy" ON public.ticket_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tickets
            WHERE id = ticket_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
-- 3. SHIPMENTS (Table uses client_id)
DROP POLICY IF EXISTS "Clients can view own shipments" ON public.shipments;
CREATE POLICY "Clients can view own shipments" ON public.shipments FOR
SELECT USING (
        client_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Authenticated users can create shipments" ON public.shipments;
CREATE POLICY "Authenticated users can create shipments" ON public.shipments FOR
INSERT WITH CHECK (
        client_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can view assigned shipments" ON public.shipments;
CREATE POLICY "Forwarders can view assigned shipments" ON public.shipments FOR
SELECT USING (
        forwarder_id = (
            select auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
                AND profiles.forwarder_id = shipments.forwarder_id
        )
    );
DROP POLICY IF EXISTS "Forwarders can update assigned shipments" ON public.shipments;
CREATE POLICY "Forwarders can update assigned shipments" ON public.shipments FOR
UPDATE USING (
        forwarder_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can delete their own pending shipments" ON public.shipments;
CREATE POLICY "Forwarders can delete their own pending shipments" ON public.shipments FOR DELETE USING (
    forwarder_id = (
        select auth.uid()
    )
    AND status = 'pending'
);
-- 4. RFQ / QUOTE REQUESTS (Table uses client_id)
DROP POLICY IF EXISTS "Clients can view own requests" ON public.rfq_requests;
CREATE POLICY "Clients can view own requests" ON public.rfq_requests FOR
SELECT USING (
        client_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Clients can create RFQs" ON public.rfq_requests;
CREATE POLICY "Clients can create RFQs" ON public.rfq_requests FOR
INSERT WITH CHECK (
        client_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Clients can view own RFQs" ON public.rfq_requests;
CREATE POLICY "Clients can view own RFQs" ON public.rfq_requests FOR
SELECT USING (
        client_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Clients can update own draft RFQs" ON public.rfq_requests;
CREATE POLICY "Clients can update own draft RFQs" ON public.rfq_requests FOR
UPDATE USING (
        client_id = (
            select auth.uid()
        )
        AND status = 'draft'
    );
DROP POLICY IF EXISTS "Clients can delete own draft RFQs" ON public.rfq_requests;
CREATE POLICY "Clients can delete own draft RFQs" ON public.rfq_requests FOR DELETE USING (
    client_id = (
        select auth.uid()
    )
    AND status = 'draft'
);
DROP POLICY IF EXISTS "Forwarders can view published RFQs" ON public.rfq_requests;
CREATE POLICY "Forwarders can view published RFQs" ON public.rfq_requests FOR
SELECT USING (
        status = 'published'
        OR public.is_admin()
    );
-- 5. QUOTES / RFQ OFFERS (Table uses forwarder_id)
DROP POLICY IF EXISTS "Forwarders can manage own quotes" ON public.rfq_offers;
CREATE POLICY "Forwarders can manage own quotes" ON public.rfq_offers FOR ALL USING (
    forwarder_id = (
        select auth.uid()
    )
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Clients can view offers on their RFQs" ON public.rfq_offers;
CREATE POLICY "Clients can view offers on their RFQs" ON public.rfq_offers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.rfq_requests
            WHERE id = rfq_id
                AND client_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can view own offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can view own offers" ON public.rfq_offers FOR
SELECT USING (
        forwarder_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can create offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can create offers" ON public.rfq_offers FOR
INSERT WITH CHECK (
        forwarder_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can update own pending offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can update own pending offers" ON public.rfq_offers FOR
UPDATE USING (
        forwarder_id = (
            select auth.uid()
        )
        AND status = 'pending'
    );
DROP POLICY IF EXISTS "Forwarders can delete own pending offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can delete own pending offers" ON public.rfq_offers FOR DELETE USING (
    forwarder_id = (
        select auth.uid()
    )
    AND status = 'pending'
);
DROP POLICY IF EXISTS "Clients can update offer status" ON public.rfq_offers;
CREATE POLICY "Clients can update offer status" ON public.rfq_offers FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.rfq_requests
            WHERE id = rfq_id
                AND client_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
-- 6. TRANSACTIONS & WALLETS (Table uses user_id)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.transactions;
CREATE POLICY "Users can view their own wallet transactions" ON public.transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.wallets
            WHERE id = transactions.wallet_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR
INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "view_own_wallet" ON public.wallets;
CREATE POLICY "view_own_wallet" ON public.wallets FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
-- 7. FORWARDER RATES (Table uses forwarder_id)
DROP POLICY IF EXISTS "Forwarders manage own rates" ON public.forwarder_rates;
CREATE POLICY "Forwarders manage own rates" ON public.forwarder_rates FOR ALL USING (
    forwarder_id = (
        select auth.uid()
    )
    OR public.is_admin()
);
-- 8. FORWARDER DOCUMENTS & SHIPMENT DOCUMENTS
DROP POLICY IF EXISTS "Forwarders can view own documents" ON public.forwarder_documents;
CREATE POLICY "Forwarders can view own documents" ON public.forwarder_documents FOR
SELECT USING (
        forwarder_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can upload documents" ON public.forwarder_documents;
CREATE POLICY "Forwarders can upload documents" ON public.forwarder_documents FOR
INSERT WITH CHECK (
        forwarder_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can view all documents" ON public.forwarder_documents;
CREATE POLICY "Admins can view all documents" ON public.forwarder_documents FOR
SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Clients can view their documents" ON public.shipment_documents;
CREATE POLICY "Clients can view their documents" ON public.shipment_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE id = shipment_id
                AND client_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can view their documents" ON public.shipment_documents;
CREATE POLICY "Forwarders can view their documents" ON public.shipment_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE id = shipment_id
                AND forwarder_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can upload" ON public.shipment_documents;
CREATE POLICY "Forwarders can upload" ON public.shipment_documents FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE id = shipment_id
                AND forwarder_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "View Access" ON public.shipment_documents;
CREATE POLICY "View Access" ON public.shipment_documents FOR
SELECT USING (
        uploaded_by = (
            select auth.uid()
        )
        OR public.is_admin()
    );
-- 9. USER PUSH TOKENS (Table uses user_id)
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can manage their own push tokens" ON public.user_push_tokens FOR ALL USING (
    user_id = (
        select auth.uid()
    )
);
-- 10. CONVERSATIONS & MESSAGES (Messaging System)
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;
CREATE POLICY "Users can view conversations they are part of" ON public.conversations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.conversation_participants
            WHERE conversation_id = id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON public.messages;
CREATE POLICY "Users can view messages of their conversations" ON public.messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id
                AND user_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.conversation_participants
            WHERE conversation_id = conversation_id
                AND user_id = (
                    select auth.uid()
                )
        )
    );
-- 11. COUPONS & USAGES
DROP POLICY IF EXISTS "Forwarders can view own coupons" ON public.coupons;
CREATE POLICY "Forwarders can view own coupons" ON public.coupons FOR
SELECT USING (
        created_by = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can update own coupons" ON public.coupons;
CREATE POLICY "Forwarders can update own coupons" ON public.coupons FOR
UPDATE USING (
        created_by = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Forwarders can delete own coupons" ON public.coupons;
CREATE POLICY "Forwarders can delete own coupons" ON public.coupons FOR DELETE USING (
    created_by = (
        select auth.uid()
    )
    OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can view their own coupon usages" ON public.coupon_usages;
CREATE POLICY "Users can view their own coupon usages" ON public.coupon_usages FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can create coupon usages" ON public.coupon_usages;
CREATE POLICY "Users can create coupon usages" ON public.coupon_usages FOR
INSERT WITH CHECK (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
-- 12. ACADEMY
DROP POLICY IF EXISTS "View own enrollment" ON public.academy_enrollments;
CREATE POLICY "View own enrollment" ON public.academy_enrollments FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can see own attempts" ON public.academy_quiz_attempts;
CREATE POLICY "Users can see own attempts" ON public.academy_quiz_attempts FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
-- 13. MISC TABLES (Sales Leads, Audit Logs, Connections)
DROP POLICY IF EXISTS "Only admins view leads" ON public.sales_leads;
CREATE POLICY "Only admins view leads" ON public.sales_leads FOR
SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR
INSERT WITH CHECK (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can update their own notifications (read status)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (read status)" ON public.notifications FOR
UPDATE USING (
        user_id = (
            select auth.uid()
        )
    );
DROP POLICY IF EXISTS "Authenticated users can insert entries" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert entries" ON public.audit_logs FOR
INSERT WITH CHECK (
        (
            select auth.uid()
        ) IS NOT NULL
    );
DROP POLICY IF EXISTS "Users can send connection requests" ON public.user_connections;
CREATE POLICY "Users can send connection requests" ON public.user_connections FOR
INSERT WITH CHECK (
        requester_id = (
            select auth.uid()
        )
    );
DROP POLICY IF EXISTS "Recipients can update status" ON public.user_connections;
CREATE POLICY "Recipients can update status" ON public.user_connections FOR
UPDATE USING (
        recipient_id = (
            select auth.uid()
        )
    );
-- 14. POS & LOCATIONS
DROP POLICY IF EXISTS "Users can view their own session operations" ON public.pos_cash_operations;
CREATE POLICY "Users can view their own session operations" ON public.pos_cash_operations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.pos_sessions
            WHERE id = session_id
                AND agent_id = (
                    select auth.uid()
                )
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Agents view their own POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents view their own POS sessions" ON public.pos_sessions FOR
SELECT USING (
        agent_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Agents create POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents create POS sessions" ON public.pos_sessions FOR
INSERT WITH CHECK (
        agent_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Agents update their own POS sessions" ON public.pos_sessions;
CREATE POLICY "Agents update their own POS sessions" ON public.pos_sessions FOR
UPDATE USING (
        agent_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Public Read Locations" ON public.locations;
CREATE POLICY "Public Read Locations" ON public.locations FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.locations;
CREATE POLICY "Users can view their own submissions" ON public.locations FOR
SELECT USING (
        submitted_by = (
            select auth.uid()
        )
        OR public.is_admin()
    );
-- 15. PLATFORM CONFIG (Admins)
DROP POLICY IF EXISTS "Admins can manage platform rates" ON public.platform_rates;
CREATE POLICY "Admins can manage platform rates" ON public.platform_rates FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage fees" ON public.fee_configs;
CREATE POLICY "Admins manage fees" ON public.fee_configs FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage gateways" ON public.payment_gateways;
CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Owner can always manage gateways" ON public.payment_gateways;
CREATE POLICY "Owner can always manage gateways" ON public.payment_gateways FOR ALL USING (
    (
        select auth.jwt()
    )->>'email' = 'wandifaproperties@gmail.com'
);
-- 16. INVOICES (Table uses user_id)
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR
SELECT USING (
        user_id = (
            select auth.uid()
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.is_admin());
-- 17. MORE ACADEMY TABLES
DROP POLICY IF EXISTS "Users can view lessons of enrolled courses" ON public.academy_lessons;
CREATE POLICY "Users can view lessons of enrolled courses" ON public.academy_lessons FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM academy_enrollments
            WHERE user_id = (
                    select auth.uid()
                )
                AND course_id = academy_lessons.course_id
        )
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Users can comment on lessons" ON public.academy_lesson_comments;
CREATE POLICY "Users can comment on lessons" ON public.academy_lesson_comments FOR
INSERT WITH CHECK (
        user_id = (
            select auth.uid()
        )
    );
DROP POLICY IF EXISTS "Users can view reviews" ON public.academy_reviews;
CREATE POLICY "Users can view reviews" ON public.academy_reviews FOR
SELECT USING (true);
-- Usually public
-- 18. SAFE BLOCKS FOR UNCERTAIN TABLES
DO $$ BEGIN -- forwarder_details
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'forwarder_details'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Forwarders can view own details" ON public.forwarder_details';
EXECUTE 'CREATE POLICY "Forwarders can view own details" ON public.forwarder_details FOR SELECT USING (profile_id = (select auth.uid()) OR public.is_admin())';
EXECUTE 'DROP POLICY IF EXISTS "Forwarders can update own details" ON public.forwarder_details';
EXECUTE 'CREATE POLICY "Forwarders can update own details" ON public.forwarder_details FOR UPDATE USING (profile_id = (select auth.uid()) OR public.is_admin())';
END IF;
-- kyc_submissions (user_id)
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'kyc_submissions'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Users can view their own submissions" ON public.kyc_submissions';
EXECUTE 'CREATE POLICY "Users can view their own submissions" ON public.kyc_submissions FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin())';
EXECUTE 'DROP POLICY IF EXISTS "Users can create their own submissions" ON public.kyc_submissions';
EXECUTE 'CREATE POLICY "Users can create their own submissions" ON public.kyc_submissions FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR public.is_admin())';
EXECUTE 'DROP POLICY IF EXISTS "Admins can view and update all submissions" ON public.kyc_submissions';
EXECUTE 'CREATE POLICY "Admins can view and update all submissions" ON public.kyc_submissions FOR ALL USING (public.is_admin())';
END IF;
-- chats & chat_messages (Alternate messaging system)
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'chats'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Users can view chats they are part of" ON public.chats';
EXECUTE 'CREATE POLICY "Users can view chats they are part of" ON public.chats FOR SELECT USING ((select auth.uid()) = ANY(participants) OR public.is_admin())';
END IF;
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'chat_messages'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages';
EXECUTE 'CREATE POLICY "Users can view messages in their chats" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chats WHERE id = chat_id AND (select auth.uid()) = ANY(participants)) OR public.is_admin())';
EXECUTE 'DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.chat_messages';
EXECUTE 'CREATE POLICY "Users can send messages to their chats" ON public.chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.chats WHERE id = chat_id AND (select auth.uid()) = ANY(participants)))';
END IF;
-- forwarder_clients_backup
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'forwarder_clients_backup'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Forwarders can view their own clients" ON public.forwarder_clients_backup';
EXECUTE 'CREATE POLICY "Forwarders can view their own clients" ON public.forwarder_clients_backup FOR SELECT USING (forwarder_id = (select auth.uid()) OR public.is_admin())';
END IF;
-- quote_requests (if separate from rfq_requests)
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'quote_requests'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Clients can view own requests" ON public.quote_requests';
EXECUTE 'CREATE POLICY "Clients can view own requests" ON public.quote_requests FOR SELECT USING (client_id = (select auth.uid()) OR public.is_admin())';
END IF;
-- quotes (legacy or different schema)
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'quotes'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Forwarders can manage own quotes" ON public.quotes';
EXECUTE 'CREATE POLICY "Forwarders can manage own quotes" ON public.quotes FOR ALL USING (forwarder_id = (select auth.uid()) OR public.is_admin())';
EXECUTE 'DROP POLICY IF EXISTS "Clients can view quotes for their requests" ON public.quotes';
EXECUTE 'CREATE POLICY "Clients can view quotes for their requests" ON public.quotes FOR SELECT USING (EXISTS (SELECT 1 FROM public.quote_requests WHERE id = request_id AND client_id = (select auth.uid())) OR public.is_admin())';
END IF;
-- consolidations
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'consolidations'
) THEN EXECUTE 'DROP POLICY IF EXISTS "Users can view their own consolidations" ON public.consolidations';
EXECUTE 'CREATE POLICY "Users can view their own consolidations" ON public.consolidations FOR SELECT USING (initiator_id = (select auth.uid()) OR public.is_admin())';
END IF;
END $$;