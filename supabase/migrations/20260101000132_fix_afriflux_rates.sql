-- ═══════════════════════════════════════════════════════════════
-- EMERGENCY FIX: AFRIFLUX RATES
-- Issue: Rates are stuck at ~4.9 Million XOF (result of double conversion).
-- Fix: Hard reset Afriflux rates to known standard market prices.
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE fwd_id UUID;
china_id UUID;
senegal_id UUID;
BEGIN -- 1. Identify Afriflux (try strict name match, then partial)
SELECT id INTO fwd_id
FROM profiles
WHERE company_name ILIKE '%Afriflux%'
LIMIT 1;
IF fwd_id IS NOT NULL THEN RAISE NOTICE 'Fixing rates for Afriflux (ID: %)',
fwd_id;
-- 2. RESET Air Standard -> 7,500 XOF
UPDATE forwarder_rates
SET price = 7500,
    currency = 'XOF'
WHERE forwarder_id = fwd_id
    AND mode = 'air'
    AND type = 'standard';
-- 3. RESET Air Express -> 10,000 XOF
UPDATE forwarder_rates
SET price = 10000,
    currency = 'XOF'
WHERE forwarder_id = fwd_id
    AND mode = 'air'
    AND type = 'express';
-- 4. RESET Sea Standard -> 150,000 XOF
UPDATE forwarder_rates
SET price = 150000,
    currency = 'XOF'
WHERE forwarder_id = fwd_id
    AND mode = 'sea';
-- 5. SAFETY NET: Fix specific 4.9M values for ANY forwarder
UPDATE forwarder_rates
SET price = 7500
WHERE price > 4900000
    AND price < 5000000
    AND unit = 'kg';
ELSE RAISE NOTICE '❌ Afriflux forwarder not found!';
END IF;
END $$;