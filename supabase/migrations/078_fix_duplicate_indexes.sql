-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Duplicate Indexes Cleanup (Phase 13)
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
-- 1. Table: messages
DROP INDEX IF EXISTS idx_messages_conv;
DROP INDEX IF EXISTS idx_messages_created;
-- 2. Table: notifications
DROP INDEX IF EXISTS idx_notif_created;
-- 3. Table: rfq_offers
DROP INDEX IF EXISTS idx_offer_forwarder;
DROP INDEX IF EXISTS idx_offer_rfq;
-- 4. Table: rfq_requests
DROP INDEX IF EXISTS idx_rfq_client;
-- 5. Table: shipments
DROP INDEX IF EXISTS idx_shipments_client_status;
DROP INDEX IF EXISTS idx_shipments_tracking_number;
-- 6. Table: tickets
-- Le linter dit que idx_tickets_user_id et idx_tickets_user_status sont identiques. 
-- Gardons le plus descriptif.
DROP INDEX IF EXISTS idx_tickets_user_id;
-- 7. Table: transactions
DROP INDEX IF EXISTS idx_transactions_status;