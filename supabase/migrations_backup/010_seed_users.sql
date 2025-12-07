-- ═══ SEED TEST USERS & DATA ═══
-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- 2. Variables for User IDs
DO $$
DECLARE client_id UUID := gen_random_uuid();
forwarder_id UUID := gen_random_uuid();
BEGIN -- 3. Create Client User (client@test.com / password123)
IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = 'client@test.com'
) THEN
INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
VALUES (
        client_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'client@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test Client", "role": "client"}',
        NOW(),
        NOW()
    );
-- Trigger should create profile, but we update it to be sure
INSERT INTO public.profiles (id, email, full_name, role, is_verified)
VALUES (
        client_id,
        'client@test.com',
        'Test Client',
        'client',
        true
    ) ON CONFLICT (id) DO
UPDATE
SET role = 'client',
    full_name = 'Test Client';
ELSE
SELECT id INTO client_id
FROM auth.users
WHERE email = 'client@test.com';
END IF;
-- 4. Create Forwarder User (forwarder@test.com / password123)
IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = 'forwarder@test.com'
) THEN
INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
VALUES (
        forwarder_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'forwarder@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "FastForward Logistics", "role": "forwarder"}',
        NOW(),
        NOW()
    );
-- Trigger should create profile, but we update it to be sure
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_verified,
        company_name
    )
VALUES (
        forwarder_id,
        'forwarder@test.com',
        'FastForward Logistics',
        'forwarder',
        true,
        'FastForward Logistics'
    ) ON CONFLICT (id) DO
UPDATE
SET role = 'forwarder',
    is_verified = true,
    company_name = 'FastForward Logistics';
ELSE
SELECT id INTO forwarder_id
FROM auth.users
WHERE email = 'forwarder@test.com';
END IF;
-- 5. Insert Sample RFQ for Client
-- Check if RFQ already exists to avoid duplicates on re-run
IF NOT EXISTS (
    SELECT 1
    FROM public.quote_requests
    WHERE client_id = client_id
        AND origin_country = 'China'
        AND destination_country = 'Senegal'
) THEN
INSERT INTO public.quote_requests (
        client_id,
        origin_country,
        destination_country,
        mode,
        type,
        cargo_details,
        status,
        created_at
    )
VALUES (
        client_id,
        'China',
        'Senegal',
        'sea',
        'standard',
        '{"description": "Electronics", "weight_kg": 500, "volume_cbm": 2}'::jsonb,
        'pending',
        NOW()
    );
END IF;
-- 6. Insert Sample Rate for Forwarder
IF NOT EXISTS (
    SELECT 1
    FROM public.rates
    WHERE forwarder_id = forwarder_id
        AND mode = 'sea'
        AND type = 'standard'
) THEN
INSERT INTO public.rates (
        forwarder_id,
        mode,
        type,
        price_per_unit,
        currency,
        transit_time_min,
        transit_time_max
    )
VALUES (
        forwarder_id,
        'sea',
        'standard',
        150.00,
        'USD',
        25,
        35
    );
END IF;
END $$;