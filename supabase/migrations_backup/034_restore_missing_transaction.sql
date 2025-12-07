-- Restore the missing 5 FCFA transaction for afriflux@gmail.com
DO $$
DECLARE v_user_id UUID;
BEGIN -- Get the user ID
SELECT id INTO v_user_id
FROM profiles
WHERE email = 'afriflux@gmail.com';
IF v_user_id IS NOT NULL THEN -- Insert the transaction if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM transactions
    WHERE amount = 5
        AND user_id = v_user_id
) THEN
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
        5,
        'XOF',
        'completed',
        'mobile_money',
        'txn_restore_' || floor(
            extract(
                epoch
                from now()
            )
        ),
        NOW(),
        '{"provider": "wave", "note": "Restored missing transaction"}'::jsonb
    );
END IF;
END IF;
END $$;