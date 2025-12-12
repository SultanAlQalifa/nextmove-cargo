-- ═══════════════════════════════════════════════════════════════
-- CALCULATOR 2.0 - DUMMY DATA SEED (For Testing)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE china_id UUID;
senegal_id UUID;
afriflux_id UUID;
globaltrans_id UUID;
speedyx_id UUID;
BEGIN -- 1. Get Locations
SELECT id INTO china_id
FROM locations
WHERE country_code = 'CN'
LIMIT 1;
SELECT id INTO senegal_id
FROM locations
WHERE country_code = 'SN'
LIMIT 1;
-- 2. Create/Get Forwarder Profiles (Link to auth.users)
-- Function to ensure user exists
-- Afriflux
SELECT id INTO afriflux_id
FROM profiles
WHERE company_name = 'Afriflux';
IF afriflux_id IS NULL THEN -- Check if user exists in auth.users by email to avoid dupes there too
SELECT id INTO afriflux_id
FROM auth.users
WHERE email = 'afriflux@test.com';
IF afriflux_id IS NULL THEN afriflux_id := gen_random_uuid();
INSERT INTO auth.users (id, email, aud, role)
VALUES (
        afriflux_id,
        'afriflux@test.com',
        'authenticated',
        'authenticated'
    );
END IF;
INSERT INTO profiles (id, company_name, role, email)
VALUES (
        afriflux_id,
        'Afriflux',
        'forwarder',
        'afriflux@test.com'
    ) ON CONFLICT (id) DO NOTHING;
END IF;
-- GlobalTrans
SELECT id INTO globaltrans_id
FROM profiles
WHERE company_name = 'GlobalTrans';
IF globaltrans_id IS NULL THEN
SELECT id INTO globaltrans_id
FROM auth.users
WHERE email = 'global@test.com';
IF globaltrans_id IS NULL THEN globaltrans_id := gen_random_uuid();
INSERT INTO auth.users (id, email, aud, role)
VALUES (
        globaltrans_id,
        'global@test.com',
        'authenticated',
        'authenticated'
    );
END IF;
INSERT INTO profiles (id, company_name, role, email)
VALUES (
        globaltrans_id,
        'GlobalTrans',
        'forwarder',
        'global@test.com'
    ) ON CONFLICT (id) DO NOTHING;
END IF;
-- SpeedyX
SELECT id INTO speedyx_id
FROM profiles
WHERE company_name = 'SpeedyX';
IF speedyx_id IS NULL THEN
SELECT id INTO speedyx_id
FROM auth.users
WHERE email = 'speedy@test.com';
IF speedyx_id IS NULL THEN speedyx_id := gen_random_uuid();
INSERT INTO auth.users (id, email, aud, role)
VALUES (
        speedyx_id,
        'speedy@test.com',
        'authenticated',
        'authenticated'
    );
END IF;
INSERT INTO profiles (id, company_name, role, email)
VALUES (
        speedyx_id,
        'SpeedyX',
        'forwarder',
        'speedy@test.com'
    ) ON CONFLICT (id) DO NOTHING;
END IF;
-- 3. SEED RATES (Wipe these forwarders first to avoid dupes)
DELETE FROM forwarder_rates
WHERE forwarder_id IN (afriflux_id, globaltrans_id, speedyx_id);
-- Afriflux: Aggressive Pricing (Cheap)
INSERT INTO forwarder_rates (
        forwarder_id,
        origin_id,
        destination_id,
        mode,
        type,
        price,
        currency,
        unit,
        min_days,
        max_days,
        insurance_rate,
        is_featured
    )
VALUES (
        afriflux_id,
        china_id,
        senegal_id,
        'air',
        'standard',
        5000,
        'XOF',
        'kg',
        7,
        12,
        0.05,
        false
    ),
    -- Cheaper than Platform
    (
        afriflux_id,
        china_id,
        senegal_id,
        'sea',
        'standard',
        130000,
        'XOF',
        'cbm',
        50,
        65,
        0.05,
        false
    );
-- Cheaper than Platform
-- GlobalTrans: Market Average (Similar to Platform)
INSERT INTO forwarder_rates (
        forwarder_id,
        origin_id,
        destination_id,
        mode,
        type,
        price,
        currency,
        unit,
        min_days,
        max_days,
        insurance_rate,
        is_featured
    )
VALUES (
        globaltrans_id,
        china_id,
        senegal_id,
        'air',
        'standard',
        7000,
        'XOF',
        'kg',
        5,
        10,
        0.05,
        false
    ),
    (
        globaltrans_id,
        china_id,
        senegal_id,
        'sea',
        'standard',
        145000,
        'XOF',
        'cbm',
        40,
        55,
        0.06,
        false
    );
-- SpeedyX: Premium & Featured (Fast & Expensive)
INSERT INTO forwarder_rates (
        forwarder_id,
        origin_id,
        destination_id,
        mode,
        type,
        price,
        currency,
        unit,
        min_days,
        max_days,
        insurance_rate,
        is_featured
    )
VALUES (
        speedyx_id,
        china_id,
        senegal_id,
        'air',
        'express',
        12000,
        'XOF',
        'kg',
        2,
        4,
        0.10,
        true
    ),
    -- Expensive but FAST
    (
        speedyx_id,
        china_id,
        senegal_id,
        'air',
        'standard',
        8000,
        'XOF',
        'kg',
        4,
        8,
        0.08,
        true
    );
RAISE NOTICE '✅ Dummy Forwarder Data Seeded (Afriflux, GlobalTrans, SpeedyX).';
END $$;