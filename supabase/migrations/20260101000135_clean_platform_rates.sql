-- ═══════════════════════════════════════════════════════════════
-- CLEAN SLATE FOR PLATFORM RATES (Fixing the 2.2 Billion Bug)
-- Issue: The "Force XOF" script blindly multiplied Platform Rates (80 EUR -> Correct XOF) again by 655.
-- Result: 52,500 * 655 = 34 Million... wait, maybe repetitive runs caused this.
-- Fix: Wipe and Re-seed cleanly.
-- ═══════════════════════════════════════════════════════════════
TRUNCATE TABLE platform_rates CASCADE;
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
VALUES -- Sea Standard: 52,500 FCFA (approx 80 EUR)
    (
        'sea',
        'standard',
        52500,
        'XOF',
        45,
        60,
        0.05,
        'cbm'
    ),
    -- Sea Express: 78,500 FCFA (approx 120 EUR)
    (
        'sea',
        'express',
        78500,
        'XOF',
        30,
        45,
        0.07,
        'cbm'
    ),
    -- Air Standard: 5,250 FCFA (approx 8 EUR)
    (
        'air',
        'standard',
        5250,
        'XOF',
        3,
        10,
        0.08,
        'kg'
    ),
    -- Air Express: 10,000 FCFA (approx 15 EUR)
    ('air', 'express', 10000, 'XOF', 1, 3, 0.10, 'kg');
RAISE NOTICE '✅ Clean Platform Rates inserted (XOF Standards).';