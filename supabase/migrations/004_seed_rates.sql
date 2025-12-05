-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Rates System & Seeding
-- Phase 3: Calculator Data
-- ═══════════════════════════════════════════════════════════════
-- ═══ TABLE: rates ═══
CREATE TABLE IF NOT EXISTS rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    mode transport_mode NOT NULL,
    -- 'sea' or 'air'
    type service_type NOT NULL,
    -- 'standard' or 'express'
    price_per_unit DECIMAL(10, 2) NOT NULL,
    transit_time_min INTEGER NOT NULL,
    transit_time_max INTEGER NOT NULL,
    insurance_rate DECIMAL(5, 4) DEFAULT 0.00,
    -- e.g. 0.05 for 5%
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_transit_time CHECK (transit_time_min <= transit_time_max),
    CONSTRAINT valid_price CHECK (price_per_unit > 0)
);
-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_rates_mode_type ON rates(mode, type);
CREATE INDEX IF NOT EXISTS idx_rates_forwarder ON rates(forwarder_id);
-- ═══ RLS POLICIES ═══
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
-- Everyone can read rates (public calculator)
CREATE POLICY "Public can view rates" ON rates FOR
SELECT USING (true);
-- Only admins and owning forwarders can manage rates
CREATE POLICY "Forwarders can manage own rates" ON rates FOR ALL USING (auth.uid() = forwarder_id) WITH CHECK (auth.uid() = forwarder_id);
CREATE POLICY "Admins can manage all rates" ON rates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ SEED DATA ═══
-- 1. Create Dummy Forwarders (if they don't exist)
-- Note: In a real scenario, these IDs would come from auth.users. 
-- For seeding, we'll try to insert them into profiles directly. 
-- If profiles.id has a FK to auth.users, this might fail if the user doesn't exist.
-- We'll assume for this seed script that we can insert into profiles or that these users exist.
-- To make it robust, we'll use a DO block.
DO $$
DECLARE fwd1_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
fwd2_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
fwd3_id UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
BEGIN -- Attempt to insert profiles. This might fail if auth.users FK constraint exists and users are missing.
-- We'll wrap in a block to ignore errors if profiles already exist or if constraint fails (in which case we can't seed rates for them).
BEGIN
INSERT INTO profiles (
        id,
        company_name,
        role,
        email,
        first_name,
        last_name
    )
VALUES (
        fwd1_id,
        'Global Logistics',
        'forwarder',
        'contact@globallogistics.com',
        'John',
        'Doe'
    ),
    (
        fwd2_id,
        'FastTrack Cargo',
        'forwarder',
        'info@fasttrack.com',
        'Jane',
        'Smith'
    ),
    (
        fwd3_id,
        'EcoShip Partners',
        'forwarder',
        'hello@ecoship.com',
        'Bob',
        'Green'
    ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not insert profiles (likely auth.users constraint). Skipping profile creation.';
END;
-- 2. Insert Rates
-- We only insert if the forwarder profile exists
IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = fwd1_id
) THEN
INSERT INTO rates (
        forwarder_id,
        mode,
        type,
        price_per_unit,
        transit_time_min,
        transit_time_max,
        insurance_rate,
        currency
    )
VALUES -- Global Logistics
    (
        fwd1_id,
        'sea',
        'standard',
        85.00,
        40,
        55,
        0.06,
        'EUR'
    ),
    (
        fwd1_id,
        'air',
        'standard',
        9.00,
        4,
        6,
        0.06,
        'EUR'
    ),
    (
        fwd1_id,
        'air',
        'express',
        15.00,
        2,
        4,
        0.06,
        'EUR'
    );
END IF;
IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = fwd2_id
) THEN
INSERT INTO rates (
        forwarder_id,
        mode,
        type,
        price_per_unit,
        transit_time_min,
        transit_time_max,
        insurance_rate,
        currency
    )
VALUES -- FastTrack Cargo
    (
        fwd2_id,
        'sea',
        'standard',
        110.00,
        25,
        40,
        0.07,
        'EUR'
    ),
    (
        fwd2_id,
        'air',
        'standard',
        14.00,
        2,
        3,
        0.07,
        'EUR'
    ),
    (
        fwd2_id,
        'air',
        'express',
        22.00,
        1,
        2,
        0.07,
        'EUR'
    );
END IF;
IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = fwd3_id
) THEN
INSERT INTO rates (
        forwarder_id,
        mode,
        type,
        price_per_unit,
        transit_time_min,
        transit_time_max,
        insurance_rate,
        currency
    )
VALUES -- EcoShip Partners
    (
        fwd3_id,
        'sea',
        'standard',
        75.00,
        50,
        65,
        0.05,
        'EUR'
    ),
    (
        fwd3_id,
        'air',
        'standard',
        7.50,
        6,
        9,
        0.05,
        'EUR'
    );
END IF;
END $$;