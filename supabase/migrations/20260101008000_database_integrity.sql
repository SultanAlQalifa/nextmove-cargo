-- ═══════════════════════════════════════════════════════════════
-- SECTION 12: DATABASE INTEGRITY & PERFORMANCE
-- ═══════════════════════════════════════════════════════════════
-- 1. PERFORMANCE INDEXING (DASHBOARD OPTIMIZATION)
-- ───────────────────────────────────────────────────────────────
-- Shipments: heavily filtered by Status and User (Client)
CREATE INDEX IF NOT EXISTS idx_shipments_client_status ON public.shipments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);
-- RFQ System: often joined
CREATE INDEX IF NOT EXISTS idx_rfq_requests_client_status ON public.rfq_requests(client_id, status);
CREATE INDEX IF NOT EXISTS idx_rfq_offers_rfq_id ON public.rfq_offers(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_offers_forwarder_id ON public.rfq_offers(forwarder_id);
-- Tickets & Support: optimized for Admin SLA sorting
CREATE INDEX IF NOT EXISTS idx_tickets_status_assignee ON public.tickets(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON public.tickets(sla_deadline ASC)
WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
-- Transactions & Wallets: financial history
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created ON public.transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
-- 2. DATA INTEGRITY (CLEANUP & CONSTRAINTS)
-- ───────────────────────────────────────────────────────────────
-- Remove orphaned notifications (User deleted but notification remained)
DELETE FROM public.notifications
WHERE user_id IS NOT NULL
    AND user_id NOT IN (
        SELECT id
        FROM auth.users
    );
-- Remove orphaned wallets (rare/impossible ideally, but good sanity check)
DELETE FROM public.wallets
WHERE user_id NOT IN (
        SELECT id
        FROM auth.users
    );
-- 3. FOREIGN KEY VALIDATION (NON-BLOCKING)
-- ───────────────────────────────────────────────────────────────
-- Ensure shipments always have a valid client (Validation check, not enforcement yet to avoid breaking legacy)
DO $$
DECLARE orphan_count INTEGER;
BEGIN
SELECT COUNT(*) INTO orphan_count
FROM public.shipments
WHERE client_id NOT IN (
        SELECT id
        FROM auth.users
    );
IF orphan_count > 0 THEN RAISE NOTICE 'WARNING: Found % orphaned shipments. Please investigate.',
orphan_count;
-- Optional: DELETE FROM public.shipments WHERE client_id NOT IN (SELECT id FROM auth.users);
END IF;
END $$;
-- 4. ANALYZE (UPDATE STATISTICS)
-- ───────────────────────────────────────────────────────────────
ANALYZE public.shipments;
ANALYZE public.rfq_requests;
ANALYZE public.tickets;