-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Driver & POD System Support
-- Phase 5: Assignment & Delivery Verification
-- ═══════════════════════════════════════════════════════════════
-- 1. Add driver_id to shipments
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.profiles(id) ON DELETE
SET NULL;
-- 2. Create INDEX for performance
CREATE INDEX IF NOT EXISTS idx_shipments_driver ON public.shipments(driver_id);
-- 3. Update shipment_status if needed (already has 'delivered', 'in_transit')
-- Ensure 'picked_up' is commonly used for driver intake.
-- 4. RLS Policies for Drivers
-- Allow drivers to view shipments assigned to them
CREATE POLICY "Drivers can view assigned shipments" ON public.shipments FOR
SELECT USING (auth.uid() = driver_id);
-- Allow drivers to update status of assigned shipments (e.g., to 'delivered')
CREATE POLICY "Drivers can update status of assigned shipments" ON public.shipments FOR
UPDATE USING (auth.uid() = driver_id);
-- Allow drivers to view events for their shipments
CREATE POLICY "Drivers can view events for assigned shipments" ON public.shipment_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_events.shipment_id
                AND s.driver_id = auth.uid()
        )
    );
-- Allow drivers to create events for their shipments (e.g., picking up, arriving)
CREATE POLICY "Drivers can create events for assigned shipments" ON public.shipment_events FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_events.shipment_id
                AND s.driver_id = auth.uid()
        )
    );
-- 5. POD System Integration (Event-based or Dedicated table)
-- We'll use a dedicated table for structured POD data
CREATE TABLE IF NOT EXISTS public.shipment_pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.profiles(id) NOT NULL,
    recipient_name TEXT NOT NULL,
    photo_urls TEXT [] DEFAULT '{}',
    signature_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- RLS for PODs
ALTER TABLE public.shipment_pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can manage own PODs" ON public.shipment_pods FOR ALL USING (auth.uid() = driver_id);
CREATE POLICY "Forwarders can view PODs for their shipments" ON public.shipment_pods FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_pods.shipment_id
                AND s.forwarder_id = auth.uid()
        )
    );
CREATE POLICY "Clients can view PODs for their shipments" ON public.shipment_pods FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_pods.shipment_id
                AND s.client_id = auth.uid()
        )
    );
-- 6. Grant Permissions (Assuming standard schema)
GRANT ALL ON public.shipments TO authenticated;
GRANT ALL ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_pods TO authenticated;