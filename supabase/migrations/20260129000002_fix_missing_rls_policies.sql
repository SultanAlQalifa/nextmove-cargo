-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Missing RLS Policies Remediation
-- Date: 2026-01-29
-- ═══════════════════════════════════════════════════════════════
-- 1. FORWARDER REVIEWS
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.forwarder_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.forwarder_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.forwarder_reviews FOR
SELECT TO public USING (true);
DROP POLICY IF EXISTS "Clients can create reviews for their shipments" ON public.forwarder_reviews;
CREATE POLICY "Clients can create reviews for their shipments" ON public.forwarder_reviews FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
        AND EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.client_id = auth.uid()
                AND s.status = 'delivered'
        )
    );
DROP POLICY IF EXISTS "Clients can update their own reviews" ON public.forwarder_reviews;
CREATE POLICY "Clients can update their own reviews" ON public.forwarder_reviews FOR
UPDATE TO authenticated USING (auth.uid() = client_id);
-- 2. FUND CALLS
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.fund_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own fund calls" ON public.fund_calls;
CREATE POLICY "Users can view own fund calls" ON public.fund_calls FOR
SELECT TO authenticated USING (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Admins can view all fund calls" ON public.fund_calls;
CREATE POLICY "Admins can view all fund calls" ON public.fund_calls FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);
-- 3. PODS (Legacy/Base POD table)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Forwarders/Clients can view related PODs" ON public.pods;
CREATE POLICY "Forwarders/Clients can view related PODs" ON public.pods FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = pods.shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                )
        )
    );
DROP POLICY IF EXISTS "Forwarders can create PODs" ON public.pods;
CREATE POLICY "Forwarders can create PODs" ON public.pods FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.forwarder_id = auth.uid()
        )
    );
-- 4. SHIPMENT PODS (Driver-based POD system)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.shipment_pods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers can manage own PODs" ON public.shipment_pods;
CREATE POLICY "Drivers can manage own PODs" ON public.shipment_pods FOR ALL TO authenticated USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Forwarders can view PODs for their shipments" ON public.shipment_pods;
CREATE POLICY "Forwarders can view PODs for their shipments" ON public.shipment_pods FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_pods.shipment_id
                AND s.forwarder_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Clients can view PODs for their shipments" ON public.shipment_pods;
CREATE POLICY "Clients can view PODs for their shipments" ON public.shipment_pods FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_pods.shipment_id
                AND s.client_id = auth.uid()
        )
    );
-- 5. RATE LIMITS
-- ───────────────────────────────────────────────────────────────
-- Only admins can see the technical rate limits. 
-- System functions bypass this with SECURITY DEFINER.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view rate limits" ON public.rate_limits;
CREATE POLICY "Admins can view rate limits" ON public.rate_limits FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
        )
    );