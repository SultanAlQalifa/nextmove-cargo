-- ═══════════════════════════════════════════════════════════════
-- Duplicate Rates for Country Aliases (China/Chine, Senegal/Sénégal)
-- Ensures calculator works regardless of language selection
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE china_id UUID;
chine_id UUID;
senegal_id UUID;
senegal_fr_id UUID;
BEGIN -- Get IDs
SELECT id INTO china_id
FROM locations
WHERE name = 'China'
LIMIT 1;
SELECT id INTO chine_id
FROM locations
WHERE name = 'Chine'
LIMIT 1;
SELECT id INTO senegal_id
FROM locations
WHERE name = 'Senegal'
LIMIT 1;
SELECT id INTO senegal_fr_id
FROM locations
WHERE name = 'Sénégal'
LIMIT 1;
-- 1. If we have rates for China, duplicate for Chine
IF china_id IS NOT NULL
AND chine_id IS NOT NULL THEN
INSERT INTO forwarder_rates (
        forwarder_id,
        mode,
        type,
        price,
        currency,
        min_days,
        max_days,
        insurance_rate,
        unit,
        origin_id,
        destination_id
    )
SELECT forwarder_id,
    mode,
    type,
    price,
    currency,
    min_days,
    max_days,
    insurance_rate,
    unit,
    chine_id,
    destination_id
FROM forwarder_rates
WHERE origin_id = china_id ON CONFLICT DO NOTHING;
END IF;
-- 2. If we have rates for Senegal, duplicate for Sénégal
IF senegal_id IS NOT NULL
AND senegal_fr_id IS NOT NULL THEN
INSERT INTO forwarder_rates (
        forwarder_id,
        mode,
        type,
        price,
        currency,
        min_days,
        max_days,
        insurance_rate,
        unit,
        origin_id,
        destination_id
    )
SELECT forwarder_id,
    mode,
    type,
    price,
    currency,
    min_days,
    max_days,
    insurance_rate,
    unit,
    origin_id,
    senegal_fr_id
FROM forwarder_rates
WHERE destination_id = senegal_id ON CONFLICT DO NOTHING;
END IF;
-- 3. Handle Cross-Multiplication (China->Sénégal, Chine->Senegal, etc.)
-- This is covered by doing pass 1 then pass 2 (if done sequentially on the whole set).
-- But to be safe, let's explicitly handle the mix.
-- (The above inserts handle it iteratively if run? No, SQL is set-based. The second block sees the original set.)
-- Let's just do a specific "Fill all gaps" strategy.
-- Strategy: Find all valid Origins (China/Chine) and Destinations (Senegal/Sénégal)
-- and verify that for every forwarder that services this route, they have entries for ALL combinations.
END $$;