-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Security Audit Remediation v2
-- Date: 2026-02-19
-- ═══════════════════════════════════════════════════════════════
-- 1. REINFORCE ADMIN WHITELIST POLICIES
-- ───────────────────────────────────────────────────────────────
-- Use the public.is_admin() helper to ensure super-admins are also included
DROP POLICY IF EXISTS "Admins can view whitelist" ON public.admin_whitelist;
CREATE POLICY "Admins can view whitelist" ON public.admin_whitelist FOR
SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage whitelist" ON public.admin_whitelist;
CREATE POLICY "Admins can manage whitelist" ON public.admin_whitelist FOR ALL TO authenticated USING (public.is_admin());
-- 2. EXTEND SHIPMENTS ACCESS TO FORWARDER STAFF
-- ───────────────────────────────────────────────────────────────
-- Allows staff members to see and update shipments belonging to their parent company
DROP POLICY IF EXISTS "Forwarders can view assigned shipments" ON public.shipments;
CREATE POLICY "Forwarders can view assigned shipments" ON public.shipments FOR
SELECT TO authenticated USING (
        auth.uid() = forwarder_id -- Master account
        OR EXISTS (
            -- Staff access
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.forwarder_id = shipments.forwarder_id
        )
    );
DROP POLICY IF EXISTS "Forwarders can update assigned shipments" ON public.shipments;
CREATE POLICY "Forwarders can update assigned shipments" ON public.shipments FOR
UPDATE TO authenticated USING (
        auth.uid() = forwarder_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.forwarder_id = shipments.forwarder_id
        )
    );
-- 3. EXTEND RFQ REQUESTS ACCESS TO FORWARDER STAFF
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Forwarders can view published RFQs" ON public.rfq_requests;
CREATE POLICY "Forwarders can view published RFQs" ON public.rfq_requests FOR
SELECT TO authenticated USING (
        status IN ('published', 'offers_received', 'offer_accepted')
        AND (
            specific_forwarder_id IS NULL
            OR specific_forwarder_id = auth.uid()
            OR EXISTS (
                -- Staff access to targeted RFQ
                SELECT 1
                FROM public.profiles
                WHERE profiles.id = auth.uid()
                    AND profiles.forwarder_id = rfq_requests.specific_forwarder_id
            )
        )
        AND EXISTS (
            -- Ensure the user is a forwarder OR staff of one
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND (
                    role = 'forwarder'::user_role
                    OR forwarder_id IS NOT NULL
                )
        )
    );
-- 4. EXTEND RFQ OFFERS ACCESS TO FORWARDER STAFF
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Forwarders can view own offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can view own offers" ON public.rfq_offers FOR
SELECT TO authenticated USING (
        auth.uid() = forwarder_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.forwarder_id = rfq_offers.forwarder_id
        )
    );
DROP POLICY IF EXISTS "Forwarders can create offers" ON public.rfq_offers;
CREATE POLICY "Forwarders can create offers" ON public.rfq_offers FOR
INSERT TO authenticated WITH CHECK (
        (
            auth.uid() = forwarder_id
            OR EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE profiles.id = auth.uid()
                    AND profiles.forwarder_id IS NOT NULL -- Simplified staff check for insert
            )
        )
        AND EXISTS (
            SELECT 1
            FROM public.rfq_requests
            WHERE id = rfq_id
                AND status IN ('published', 'offers_received')
        )
    );
-- 5. STANDARDIZE ADMIN POLICIES WITH IS_ADMIN()
-- ───────────────────────────────────────────────────────────────
-- Fixing any legacy policies that check for 'admin' string instead of helper function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT TO authenticated USING (public.is_admin());
-- Ensure personnel and roles management is also secured by the helper
DROP POLICY IF EXISTS "Admins can manage roles" ON public.staff_roles;
CREATE POLICY "Admins can manage roles" ON public.staff_roles FOR ALL TO authenticated USING (public.is_admin());
-- 6. SHIPMENT EVENTS STAFF ACCESS
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view events for their shipments" ON shipment_events;
CREATE POLICY "Users can view events for their shipments" ON shipment_events FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_events.shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.profiles p
                        WHERE p.id = auth.uid()
                            AND p.forwarder_id = s.forwarder_id
                    )
                )
        )
    );
DROP POLICY IF EXISTS "Forwarders can create events for assigned shipments" ON shipment_events;
CREATE POLICY "Forwarders can create events for assigned shipments" ON shipment_events FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_events.shipment_id
                AND (
                    s.forwarder_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.profiles p
                        WHERE p.id = auth.uid()
                            AND p.forwarder_id = s.forwarder_id
                    )
                )
        )
    );