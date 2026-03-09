-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Final Index Optimization (Phase 14 - Full)
-- Goal: 0 INFO Warnings (Unindexed Foreign Keys & Unused Indexes)
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
-- 1. INDEXATION DES CLÉS ÉTRANGÈRES MANQUANTES
-- Améliore les performances des DELETE, JOIN et contraintes d'intégrité.
DO $$ BEGIN -- Academy
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_cert_pay_id ON public.academy_enrollments(certificate_payment_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course_id ON public.academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course_id ON public.academy_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_comments_lesson_id ON public.academy_lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_comments_parent_id ON public.academy_lesson_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_comments_user_id ON public.academy_lesson_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_lesson_likes_user_id ON public.academy_lesson_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_quiz_id ON public.academy_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_user_id ON public.academy_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_options_question_id ON public.academy_quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_questions_quiz_id ON public.academy_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_academy_reviews_user_id ON public.academy_reviews(user_id);
-- System & Logs
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_added_by ON public.admin_whitelist(added_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_sender_id ON public.email_queue(sender_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON public.system_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
-- Business Logic & Finances
CREATE INDEX IF NOT EXISTS idx_consolidations_initiator_id ON public.consolidations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_shipment_id ON public.coupon_usages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_fund_calls_requester_id ON public.fund_calls(requester_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON public.payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON public.point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment_id ON public.invoices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON public.transactions(invoice_id);
-- Forwarders & Rates
CREATE INDEX IF NOT EXISTS idx_forwarder_clients_backup_client_id ON public.forwarder_clients_backup(client_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_details_profile_id ON public.forwarder_details(profile_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_documents_forwarder_id ON public.forwarder_documents(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_rates_destination_id ON public.forwarder_rates(destination_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_rates_origin_id ON public.forwarder_rates(origin_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_reviews_client_id ON public.forwarder_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_forwarder_reviews_forwarder_id ON public.forwarder_reviews(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_platform_rates_destination_id ON public.platform_rates(destination_id);
CREATE INDEX IF NOT EXISTS idx_platform_rates_origin_id ON public.platform_rates(origin_id);
-- KYC & Profiles
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_reviewed_by ON public.kyc_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_forwarder_id ON public.profiles(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_tier_id ON public.profiles(loyalty_tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role_id ON public.profiles(staff_role_id);
CREATE INDEX IF NOT EXISTS idx_saved_quotes_user_id ON public.saved_quotes(user_id);
-- Locations & Packages
CREATE INDEX IF NOT EXISTS idx_locations_submitted_by ON public.locations(submitted_by);
CREATE INDEX IF NOT EXISTS idx_package_types_submitted_by ON public.package_types(submitted_by);
-- Communications & POS
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_operations_approved_by ON public.pos_cash_operations(approved_by);
CREATE INDEX IF NOT EXISTS idx_pos_cash_operations_session_id ON public.pos_cash_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_agent_id ON public.pos_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_station_id ON public.pos_sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_pos_stations_branch_id ON public.pos_stations(branch_id);
CREATE INDEX IF NOT EXISTS idx_pos_stations_forwarder_id ON public.pos_stations(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
-- Shipments & Quotes
CREATE INDEX IF NOT EXISTS idx_delivery_updates_shipment_id ON public.delivery_updates(shipment_id);
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipment_documents'
        AND column_name = 'uploaded_by_id'
) THEN CREATE INDEX IF NOT EXISTS idx_shipment_documents_uploaded_by ON public.shipment_documents(uploaded_by_id);
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipment_documents'
        AND column_name = 'uploaded_by'
) THEN CREATE INDEX IF NOT EXISTS idx_shipment_documents_uploaded_by ON public.shipment_documents(uploaded_by);
END IF;
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_pods_driver_id ON public.shipment_pods(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipment_pods_shipment_id ON public.shipment_pods(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_forwarder_id ON public.shipments(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_shipments_rfq_id ON public.shipments(rfq_id);
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'parent_shipment_id'
) THEN CREATE INDEX IF NOT EXISTS idx_shipments_parent_shipment_id ON public.shipments(parent_shipment_id);
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'parent_id'
) THEN CREATE INDEX IF NOT EXISTS idx_shipments_parent_shipment_id ON public.shipments(parent_id);
END IF;
CREATE INDEX IF NOT EXISTS idx_shipments_pos_session_id ON public.shipments(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_pods_shipment_id ON public.pods(shipment_id);
CREATE INDEX IF NOT EXISTS idx_proof_of_delivery_shipment_id ON public.proof_of_delivery(shipment_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_client_id ON public.quote_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_forwarder_id ON public.quotes(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rates_forwarder_id ON public.rates(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_user_id ON public.sales_leads(user_id);
-- RFQ Requests
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfq_requests'
        AND column_name = 'parent_rfq_id'
) THEN CREATE INDEX IF NOT EXISTS idx_rfq_requests_parent_rfq_id ON public.rfq_requests(parent_rfq_id);
END IF;
-- Détection dynamique pour Quotes (request_id vs quote_request_id)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
        AND column_name = 'request_id'
) THEN CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON public.quotes(request_id);
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
        AND column_name = 'quote_request_id'
) THEN CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON public.quotes(quote_request_id);
END IF;
END $$;
-- 2. SUPPRESSION DES INDEX INUTILISÉS (NETTOYAGE FINAL)
DROP INDEX IF EXISTS idx_blog_posts_author_author_id;
DROP INDEX IF EXISTS idx_fkey_enrollments_course;
DROP INDEX IF EXISTS idx_fkey_lessons_course;
DROP INDEX IF EXISTS idx_fkey_chat_sender;
DROP INDEX IF EXISTS idx_fkey_payments_shipment;
DROP INDEX IF EXISTS idx_fkey_shipments_rfq;
DROP INDEX IF EXISTS idx_quotes_req_id;
-- Index inutilisés identifiés historiquement
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_tickets_user_status;
DROP INDEX IF EXISTS idx_rate_limits_last_refill;
DROP INDEX IF EXISTS idx_rfq_expires;
DROP INDEX IF EXISTS idx_offer_submitted;
DROP INDEX IF EXISTS idx_offer_expires;
DROP INDEX IF EXISTS idx_profiles_push_tokens;
DROP INDEX IF EXISTS idx_ticket_messages_created_at;
DROP INDEX IF EXISTS idx_shipments_tracking_search;
DROP INDEX IF EXISTS idx_shipments_composite_user_status;
DROP INDEX IF EXISTS idx_shipments_departure_date;
DROP INDEX IF EXISTS idx_rfq_parent;
DROP INDEX IF EXISTS idx_forwarder_addresses_country;
DROP INDEX IF EXISTS idx_tickets_sla_deadline;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_profiles_friendly_id;
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_coupons_active;
DROP INDEX IF EXISTS idx_transactions_wallet_id;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_tickets_status_assignee;
DROP INDEX IF EXISTS idx_invoices_shipment;
DROP INDEX IF EXISTS idx_transactions_invoice;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_action;
-- 3. MAINTENANCE (Manuel)
-- VACUUM ANALYZE net._http_response;