-- Seed a test transaction to verify Admin Payments page
-- Tries to find a user matching 'afriflux', otherwise uses the first available user
DO $$
DECLARE v_user_id UUID;
BEGIN -- Try to find a user with 'afriflux' in name or email
SELECT id INTO v_user_id
FROM profiles
WHERE full_name ILIKE '%afriflux%'
    OR email ILIKE '%afriflux%'
LIMIT 1;
-- Fallback to any user if not found (just to test the table)
IF v_user_id IS NULL THEN
SELECT id INTO v_user_id
FROM profiles
LIMIT 1;
END IF;
IF v_user_id IS NOT NULL THEN
INSERT INTO transactions (
        user_id,
        amount,
        currency,
        status,
        method,
        reference,
        created_at,
        metadata
    )
VALUES (
        v_user_id,
        50000.00,
        'XOF',
        'completed',
        'mobile_money',
        'txn_afriflux_' || floor(
            extract(
                epoch
                from now()
            )
        ),
        NOW(),
        '{"provider": "wave", "note": "Test transaction for debugging"}'::jsonb
    );
END IF;
END $$;