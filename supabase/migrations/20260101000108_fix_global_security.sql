-- CRITICAL FIX: Enable RLS on tables where it was found disabled
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
-- POLICIES FOR SHIPMENT_EVENTS
-- Links to shipment_id. Users should see events if they can see the shipment.
-- This usually requires a join or existence check on shipments table policies.
-- Ideally, we mirror the logic: "If user is owner of shipment OR assigned forwarder OR admin".
-- 1. Admins see all events
DROP POLICY IF EXISTS "Admins can view all events" ON public.shipment_events;
CREATE POLICY "Admins can view all events" ON public.shipment_events FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);
-- 2. Users (Clients/Forwarders) see events for shipments they have access to
-- We use a simplified check: If you can SELECT the shipment, you can SELECT the event.
-- However, RLS recursion can be tricky.
-- Safer approach:
-- Clients can see if they are the owner of the shipment.
-- Forwarders can see if they are the carrier.
DROP POLICY IF EXISTS "Clients can view events for own shipments" ON public.shipment_events;
CREATE POLICY "Clients can view events for own shipments" ON public.shipment_events FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE shipments.id = shipment_events.shipment_id
                AND shipments.client_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Forwarders can view events for assigned shipments" ON public.shipment_events;
CREATE POLICY "Forwarders can view events for assigned shipments" ON public.shipment_events FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE shipments.id = shipment_events.shipment_id
                AND shipments.forwarder_id = auth.uid()
        )
    );
-- 3. Public Tracking?
-- If we want a public tracking page (e.g. /track/123), we normally need a policy.
-- But usually tracking pages use a specific tracking_number, not ID.
-- If the app uses `trackingService` with a public anon key, we need a policy.
-- Assuming "Public can view events if they have the tracking number" is hard to implement in RLS directly without a function.
-- For now, if the app doesn't have a public tracking page (only dashboard), we keep it authenticated only.
-- If there IS a public tracking page, it likely calls an Edge Function or RPC to bypass RLS safely.
-- POLICIES FOR PROOF_OF_DELIVERY
-- Similar to events.
DROP POLICY IF EXISTS "Admins can view all PODs" ON public.proof_of_delivery;
CREATE POLICY "Admins can view all PODs" ON public.proof_of_delivery FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);
DROP POLICY IF EXISTS "Clients can view PODs for own shipments" ON public.proof_of_delivery;
CREATE POLICY "Clients can view PODs for own shipments" ON public.proof_of_delivery FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments
            WHERE shipments.id = proof_of_delivery.shipment_id
                AND shipments.client_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Forwarders can manage PODs for assigned shipments" ON public.proof_of_delivery;
CREATE POLICY "Forwarders can manage PODs for assigned shipments" ON public.proof_of_delivery FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.shipments
        WHERE shipments.id = proof_of_delivery.shipment_id
            AND shipments.forwarder_id = auth.uid()
    )
);