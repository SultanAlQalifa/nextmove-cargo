-- ═══════════════════════════════════════════════════════════════
-- REVERSE CURRENCY FIX
-- Error: We multiplied values by 655 because they were labeled 'EUR', 
-- but the User confirmed the numerical value (e.g. 7500) was ALREADY in XOF.
-- We must DIVIDE by 655.957 to restore the correct XOF amount.
-- ═══════════════════════════════════════════════════════════════
-- 1. Fix Air Rates (KG) that are absurdly high (> 100,000 XOF/kg)
UPDATE forwarder_rates
SET price = price / 655.957
WHERE unit = 'kg'
    AND price > 100000
    AND currency = 'XOF';
-- 2. Fix Sea Rates (CBM) that are absurdly high (> 5,000,000 XOF/cbm)
-- A normal CBM rate is ~100,000 - 200,000. 5M is definitely the result of bad multiplication.
UPDATE forwarder_rates
SET price = price / 655.957
WHERE unit = 'cbm'
    AND price > 5000000
    AND currency = 'XOF';
-- 3. Rounding to nice numbers (optional, but clean)
UPDATE forwarder_rates
SET price = ROUND(price);
-- Verify
DO $$
DECLARE fixed_count integer;
BEGIN
SELECT COUNT(*) INTO fixed_count
FROM forwarder_rates
WHERE price > 4000000
    AND unit = 'kg';
IF fixed_count > 0 THEN RAISE NOTICE 'WARNING: % Air rates still seem too high.',
fixed_count;
END IF;
END $$;