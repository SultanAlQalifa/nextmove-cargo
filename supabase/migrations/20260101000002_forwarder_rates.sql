-- Forwarder Rates and Transport Modes Migration
DO $$ BEGIN -- 1. Add transport_modes to profiles if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'transport_modes'
) THEN
ALTER TABLE profiles
ADD COLUMN transport_modes TEXT [] DEFAULT '{}';
END IF;
-- 2. Create forwarder_rates table if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'forwarder_rates'
) THEN CREATE TABLE forwarder_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    origin_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL,
    -- 'sea', 'air'
    type VARCHAR(50) NOT NULL,
    -- 'standard', 'express'
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    min_days INTEGER,
    max_days INTEGER,
    insurance_rate DECIMAL(5, 4) DEFAULT 0,
    -- e.g. 0.05 for 5%
    unit VARCHAR(20) DEFAULT 'cbm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Security: Enable RLS
ALTER TABLE forwarder_rates ENABLE ROW LEVEL SECURITY;
-- Policies
-- Forwarders can manage their own rates
CREATE POLICY "Forwarders manage own rates" ON forwarder_rates KEY (forwarder_id = auth.uid()) WITH CHECK (forwarder_id = auth.uid());
-- Everyone (logged in) can read rates (for calculation purposes)
CREATE POLICY "Authenticated users can read" ON forwarder_rates FOR
SELECT TO authenticated USING (true);
END IF;
-- 3. Unique Index for Route Specificity per Forwarder
-- Ensure one rate per (Forwarder, Mode, Type, Origin, Destination)
-- Using COALESCE for Global rates (where origin/dest are NULL)
DROP INDEX IF EXISTS forwarder_rates_unique_route;
CREATE UNIQUE INDEX forwarder_rates_unique_route ON forwarder_rates (
    forwarder_id,
    mode,
    type,
    COALESCE(
        origin_id,
        '00000000-0000-0000-0000-000000000000'
    ),
    COALESCE(
        destination_id,
        '00000000-0000-0000-0000-000000000000'
    )
);
END $$;