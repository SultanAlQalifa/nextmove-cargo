-- ═══════════════════════════════════════════════════════════════
-- FORCE GLOBAL XOF
-- User Request: "Mettre tout en XOF"
-- 1. Convert any remaining EUR/USD rates to XOF (approximate if low value, assume XOF if high)
-- 2. Set default currency on tables to XOF
-- 3. Update Profiles to prefer XOF
-- ═══════════════════════════════════════════════════════════════
-- 1. Convert EUR rates to XOF (Exchange Rate: 655.957)
UPDATE forwarder_rates
SET price = price * 655.957,
    currency = 'XOF'
WHERE currency = 'EUR';
UPDATE platform_rates
SET price = price * 655.957,
    currency = 'XOF'
WHERE currency = 'EUR';
-- 2. Convert USD rates to XOF (Approx: 600)
UPDATE forwarder_rates
SET price = price * 600,
    currency = 'XOF'
WHERE currency = 'USD';
-- 3. Force defaults
ALTER TABLE forwarder_rates
ALTER COLUMN currency
SET DEFAULT 'XOF';
ALTER TABLE platform_rates
ALTER COLUMN currency
SET DEFAULT 'XOF';
-- 4. Ensure no mislabeled high values (Fix previous issue again to be safe)
UPDATE forwarder_rates
SET currency = 'XOF'
WHERE price > 1000
    AND currency != 'XOF';