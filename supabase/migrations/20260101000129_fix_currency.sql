-- ═══════════════════════════════════════════════════════════════
-- Fix Currency for High Value Rates
-- Issue: Some rates are 7500 (XOF) but labeled as 'EUR'.
-- Result: Calculator converts 7500 EUR -> 4.9 Million XOF.
-- Fix: Force currency to 'XOF' for any price > 500 (safe threshold).
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE updated_count integer;
BEGIN
UPDATE forwarder_rates
SET currency = 'XOF'
WHERE price > 500
    AND currency != 'XOF';
GET DIAGNOSTICS updated_count = ROW_COUNT;
RAISE NOTICE 'Updated % rates to XOF',
updated_count;
END $$;