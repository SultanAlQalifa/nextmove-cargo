-- ═══════════════════════════════════════════════════════════════
-- CALCULATOR 2.0 SCHEMA & SEED (Phase 1)
-- ═══════════════════════════════════════════════════════════════
-- 1. SCHEMA UPDATES
-- Ensure `forwarder_rates` has all necessary columns
DO $$ BEGIN -- is_featured (Sponsoring)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_rates'
        AND column_name = 'is_featured'
) THEN
ALTER TABLE forwarder_rates
ADD COLUMN is_featured BOOLEAN DEFAULT false;
END IF;
-- is_active (Soft delete)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_rates'
        AND column_name = 'is_active'
) THEN
ALTER TABLE forwarder_rates
ADD COLUMN is_active BOOLEAN DEFAULT true;
END IF;
-- insurance_rate (Specific per forwarder)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_rates'
        AND column_name = 'insurance_rate'
) THEN
ALTER TABLE forwarder_rates
ADD COLUMN insurance_rate NUMERIC DEFAULT 0.05;
-- Default 5%
END IF;
END $$;
-- Ensure `platform_rates` has necessary columns
DO $$ BEGIN -- is_global (Explicit flag)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'platform_rates'
        AND column_name = 'is_global'
) THEN
ALTER TABLE platform_rates
ADD COLUMN is_global BOOLEAN DEFAULT true;
END IF;
END $$;
-- 2. SEED OFFICIAL PLATFORM RATES (The "Gold Standard")
-- Wipe old platform rates to ensure clean state
TRUNCATE TABLE platform_rates CASCADE;
-- Insert Strict 4 Modes
INSERT INTO platform_rates (
        mode,
        type,
        price,
        currency,
        unit,
        min_days,
        max_days,
        insurance_rate,
        is_global
    )
VALUES -- FRET MARITIME - Standard (150k XOF / 45-60 days)
    (
        'sea',
        'standard',
        150000,
        'XOF',
        'cbm',
        45,
        60,
        0.05,
        true
    ),
    -- FRET MARITIME - Express (200k XOF / 30-45 days)
    (
        'sea',
        'express',
        200000,
        'XOF',
        'cbm',
        30,
        45,
        0.07,
        true
    ),
    -- Higher insurance for express? kept close.
    -- FRET AÉRIEN - Standard (7.5k XOF / 5-10 days)
    (
        'air',
        'standard',
        7500,
        'XOF',
        'kg',
        5,
        10,
        0.05,
        true
    ),
    -- FRET AÉRIEN - Express (10k XOF / 1-5 days)
    (
        'air',
        'express',
        10000,
        'XOF',
        'kg',
        1,
        5,
        0.05,
        true
    );
DO $$ BEGIN RAISE NOTICE '✅ Calculator 2.0 Schema Applied & Platform Rates Seeded.';
END $$;