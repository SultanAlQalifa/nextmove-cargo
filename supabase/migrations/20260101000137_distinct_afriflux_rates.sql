-- Make Afriflux Rates Distinct from Platform Rates
-- Platform Standard: 5,250 FCFA
-- Platform Express: 10,000 FCFA
DO $$
DECLARE fwd_id UUID;
china_id UUID;
senegal_id UUID;
BEGIN -- Get IDs
SELECT id INTO fwd_id
FROM profiles
WHERE company_name ILIKE '%Afriflux%'
LIMIT 1;
SELECT id INTO china_id
FROM locations
WHERE name = 'China'
LIMIT 1;
SELECT id INTO senegal_id
FROM locations
WHERE name = 'Senegal'
LIMIT 1;
IF fwd_id IS NOT NULL
AND china_id IS NOT NULL
AND senegal_id IS NOT NULL THEN -- 1. Update Air Standard to 5,000 (Cheaper/Different from 5,250)
UPDATE forwarder_rates
SET price = 5000
WHERE forwarder_id = fwd_id
    AND origin_id = china_id
    AND destination_id = senegal_id
    AND mode = 'air'
    AND type = 'standard';
-- 2. Update Air Express to 7,000 (Different from 10,000)
UPDATE forwarder_rates
SET price = 7000
WHERE forwarder_id = fwd_id
    AND origin_id = china_id
    AND destination_id = senegal_id
    AND mode = 'air'
    AND type = 'express';
RAISE NOTICE '✅ Afriflux rates updated: Standard=5000, Express=7000';
END IF;
END $$;