-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Real-time Delivery Tracking
-- ═══════════════════════════════════════════════════════════════
-- 1. Create table for granular GPS updates
CREATE TABLE IF NOT EXISTS public.delivery_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Create INDEX for performance
CREATE INDEX IF NOT EXISTS idx_delivery_updates_shipment_id ON public.delivery_updates(shipment_id);
-- 3. Enable RLS
ALTER TABLE public.delivery_updates ENABLE ROW LEVEL SECURITY;
-- 4. RLS Policies
-- Drivers can insert their own updates
CREATE POLICY "Drivers can insert delivery updates" ON public.delivery_updates FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND s.driver_id = auth.uid()
        )
    );
-- Clients, Forwarders and Admins can view updates
CREATE POLICY "Users can view delivery updates" ON public.delivery_updates FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.shipments s
            WHERE s.id = shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                    OR s.driver_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.profiles p
                        WHERE p.id = auth.uid()
                            AND p.role = 'admin'
                    )
                )
        )
    );
-- 5. Enable Realtime
-- This requires adding the table to the supabase_realtime publication
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'delivery_updates'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE delivery_updates;
END IF;
END $$;
-- 6. Grant Permissions
GRANT ALL ON public.delivery_updates TO authenticated;
GRANT ALL ON public.delivery_updates TO service_role;