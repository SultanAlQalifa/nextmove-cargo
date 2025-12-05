-- ==========================================
-- PLATFORM RATES (Standard Tariffs)
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL CHECK (mode IN ('sea', 'air', 'road')),
    type TEXT NOT NULL CHECK (type IN ('standard', 'express')),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    min_days INTEGER NOT NULL,
    max_days INTEGER NOT NULL,
    insurance_rate DECIMAL(5, 4) DEFAULT 0.05,
    -- e.g. 0.05 for 5%
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'cbm')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mode, type)
);
-- Enable RLS
ALTER TABLE platform_rates ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public read access to platform rates" ON platform_rates FOR
SELECT USING (true);
CREATE POLICY "Admins can manage platform rates" ON platform_rates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Seed Data (from calculatorService.ts hardcoded values)
INSERT INTO platform_rates (
        mode,
        type,
        price,
        currency,
        min_days,
        max_days,
        insurance_rate,
        unit
    )
VALUES (
        'sea',
        'standard',
        80.00,
        'EUR',
        45,
        60,
        0.05,
        'cbm'
    ),
    (
        'sea',
        'express',
        120.00,
        'EUR',
        30,
        45,
        0.07,
        'cbm'
    ),
    (
        'air',
        'standard',
        8.00,
        'EUR',
        3,
        10,
        0.08,
        'kg'
    ),
    ('air', 'express', 15.00, 'EUR', 1, 3, 0.10, 'kg') ON CONFLICT (mode, type) DO
UPDATE
SET price = EXCLUDED.price,
    min_days = EXCLUDED.min_days,
    max_days = EXCLUDED.max_days,
    insurance_rate = EXCLUDED.insurance_rate,
    unit = EXCLUDED.unit;
-- Trigger for updated_at
CREATE TRIGGER update_platform_rates_updated_at BEFORE
UPDATE ON platform_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();