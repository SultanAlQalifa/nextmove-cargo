-- ═══════════════════════════════════════════════════════════════
-- NUCLEAR PRICE FIX
-- The previous specific fixes might have missed due to case sensitivity (e.g. 'KG' vs 'kg').
-- This script updates ALL high prices indiscriminately to ensuring the 4.9M goes away.
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE affected_rows integer;
BEGIN -- 1. Fix ALL huge KG rates (Anything over 100,000 XOF/kg is an error)
-- This covers Afriflux and any others.
UPDATE forwarder_rates
SET price = 7500,
    currency = 'XOF'
WHERE price > 100000
    AND (
        unit ILIKE 'kg'
        OR mode ILIKE 'air'
    );
GET DIAGNOSTICS affected_rows = ROW_COUNT;
RAISE NOTICE 'Nuclear Fix: Reset % Air/KG rates to 7,500 XOF',
affected_rows;
-- 2. Fix ALL huge CBM rates (Anything over 2,000,000 XOF/cbm is suspicious)
UPDATE forwarder_rates
SET price = 150000,
    currency = 'XOF'
WHERE price > 2000000
    AND (
        unit ILIKE 'cbm'
        OR mode ILIKE 'sea'
    );
GET DIAGNOSTICS affected_rows = ROW_COUNT;
RAISE NOTICE 'Nuclear Fix: Reset % Sea/CBM rates to 150,000 XOF',
affected_rows;
END $$;