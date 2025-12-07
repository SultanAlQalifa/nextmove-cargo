-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Shipment System
-- Phase 4: Shipment Tracking & Management
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
CREATE TYPE shipment_status AS ENUM (
    'pending',
    -- En attente de prise en charge
    'picked_up',
    -- Ramassé / Reçu au port
    'in_transit',
    -- En cours d'acheminement
    'customs',
    -- En douane
    'delivered',
    -- Livré
    'cancelled' -- Annulé
);
-- ═══ TABLE: shipments ═══
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    -- Relationships
    rfq_id UUID REFERENCES rfq_requests(id) ON DELETE
    SET NULL,
        offer_id UUID REFERENCES rfq_offers(id) ON DELETE
    SET NULL,
        client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        forwarder_id UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        -- Route Details (copied from RFQ for history)
        origin_port VARCHAR(255) NOT NULL,
        origin_country VARCHAR(2) DEFAULT 'CN',
        -- Default to China/Senegal if not specified, logic to be refined
        destination_port VARCHAR(255) NOT NULL,
        destination_country VARCHAR(2) DEFAULT 'SN',
        -- Carrier & Logistics
        carrier_name VARCHAR(255),
        carrier_logo VARCHAR(255),
        -- Cargo Details
        cargo_type VARCHAR(255),
        cargo_weight DECIMAL(10, 2),
        cargo_volume DECIMAL(10, 2),
        cargo_packages INTEGER,
        -- Dates
        departure_date DATE,
        arrival_estimated_date DATE,
        arrival_actual_date DATE,
        -- Status & Progress
        status shipment_status DEFAULT 'pending' NOT NULL,
        progress INTEGER DEFAULT 0 CHECK (
            progress >= 0
            AND progress <= 100
        ),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- ═══ TABLE: shipment_events ═══
CREATE TABLE IF NOT EXISTS shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
    status shipment_status NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_shipments_client ON shipments(client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_forwarder ON shipments(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);
-- ═══ RLS POLICIES ═══
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
-- Shipments Policies
CREATE POLICY "Clients can view own shipments" ON shipments FOR
SELECT USING (auth.uid() = client_id);
CREATE POLICY "Forwarders can view assigned shipments" ON shipments FOR
SELECT USING (auth.uid() = forwarder_id);
CREATE POLICY "Forwarders can update assigned shipments" ON shipments FOR
UPDATE USING (auth.uid() = forwarder_id);
CREATE POLICY "Admins can view all shipments" ON shipments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Events Policies
CREATE POLICY "Users can view events for their shipments" ON shipment_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_events.shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                )
        )
    );
CREATE POLICY "Forwarders can create events for assigned shipments" ON shipment_events FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_events.shipment_id
                AND s.forwarder_id = auth.uid()
        )
    );
CREATE POLICY "Admins can manage all events" ON shipment_events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ TRIGGERS & FUNCTIONS ═══
-- Function: Generate Tracking Number
CREATE OR REPLACE FUNCTION generate_tracking_number() RETURNS TEXT AS $$
DECLARE year TEXT := to_char(NOW(), 'YYYY');
seq INTEGER;
new_tracking TEXT;
BEGIN -- This is a simple sequence generation. In high concurrency, consider a sequence object.
-- For now, random string or count based is fine for MVP.
new_tracking := 'NMC-' || year || '-' || upper(
    substring(
        md5(random()::text)
        from 1 for 6
    )
);
RETURN new_tracking;
END;
$$ LANGUAGE plpgsql;
-- Function: Auto-create Shipment on Offer Acceptance
CREATE OR REPLACE FUNCTION create_shipment_on_accept() RETURNS TRIGGER AS $$
DECLARE rfq_record RECORD;
new_tracking TEXT;
BEGIN -- Only proceed if status changed to 'accepted'
IF NEW.status = 'accepted'
AND OLD.status != 'accepted' THEN -- Fetch RFQ details
SELECT * INTO rfq_record
FROM rfq_requests
WHERE id = NEW.rfq_id;
-- Generate Tracking Number
new_tracking := generate_tracking_number();
-- Insert Shipment
INSERT INTO shipments (
        tracking_number,
        rfq_id,
        offer_id,
        client_id,
        forwarder_id,
        origin_port,
        destination_port,
        carrier_name,
        cargo_type,
        cargo_weight,
        cargo_volume,
        cargo_packages,
        departure_date,
        arrival_estimated_date,
        status,
        progress
    )
VALUES (
        new_tracking,
        NEW.rfq_id,
        NEW.id,
        rfq_record.client_id,
        NEW.forwarder_id,
        rfq_record.origin_port,
        rfq_record.destination_port,
        'Pending Assignment',
        -- Carrier name to be filled by forwarder later
        rfq_record.cargo_type,
        rfq_record.weight_kg,
        rfq_record.volume_cbm,
        rfq_record.quantity,
        NEW.departure_date,
        NEW.arrival_date,
        'pending',
        0
    );
-- Create Initial Event
INSERT INTO shipment_events (
        shipment_id,
        status,
        location,
        description
    )
VALUES (
        (
            SELECT id
            FROM shipments
            WHERE tracking_number = new_tracking
        ),
        'pending',
        rfq_record.origin_port,
        'Expédition créée suite à l''acceptation du devis'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger: Create Shipment
DROP TRIGGER IF EXISTS on_offer_accepted_create_shipment ON rfq_offers;
CREATE TRIGGER on_offer_accepted_create_shipment
AFTER
UPDATE ON rfq_offers FOR EACH ROW EXECUTE FUNCTION create_shipment_on_accept();