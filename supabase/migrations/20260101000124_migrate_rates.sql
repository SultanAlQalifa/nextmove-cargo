-- ═══════════════════════════════════════════════════════════════
-- Migrate Legacy 'rates' to 'forwarder_rates'
-- Updated: Force China->Senegal link more aggressively
-- ═══════════════════════════════════════════════════════════════
INSERT INTO forwarder_rates (
        forwarder_id,
        mode,
        type,
        price,
        currency,
        min_days,
        max_days,
        insurance_rate,
        unit
    )
SELECT forwarder_id,
    mode,
    type,
    price_per_unit,
    currency,
    transit_time_min,
    transit_time_max,
    0.05,
    CASE
        WHEN mode = 'sea' THEN 'cbm'
        ELSE 'kg'
    END
FROM rates
WHERE NOT EXISTS (
        SELECT 1
        FROM forwarder_rates
        WHERE forwarder_rates.forwarder_id = rates.forwarder_id
            AND forwarder_rates.mode = rates.mode
            AND forwarder_rates.type = rates.type
    );
DO $$
DECLARE china_id UUID;
senegal_id UUID;
BEGIN
SELECT id INTO china_id
FROM locations
WHERE name = 'China'
    OR name = 'Chine'
LIMIT 1;
SELECT id INTO senegal_id
FROM locations
WHERE name = 'Senegal'
    OR name = 'Sénégal'
    OR name = 'Senegal (SN)'
LIMIT 1;
-- Force update for ANY record with missing origin/destination
-- Only if locations found
IF china_id IS NOT NULL
AND senegal_id IS NOT NULL THEN
UPDATE forwarder_rates
SET origin_id = china_id,
    destination_id = senegal_id
WHERE (
        origin_id IS NULL
        OR destination_id IS NULL
    );
ELSE RAISE NOTICE 'Skipping Route Link: Could not find China or Senegal locations.';
END IF;
END $$;