-- Migration to make loyalty and referral point prices dynamic
-- 1. Initialize 'loyalty' settings if missing
INSERT INTO public.system_settings (key, value)
VALUES (
        'loyalty',
        '{"point_value": 10}'::jsonb
    ) ON CONFLICT (key) DO NOTHING;
-- 2. Ensure 'referral' settings have 'point_value'
UPDATE public.system_settings
SET value = value || '{"point_value": 50}'::jsonb
WHERE key = 'referral'
    AND (value->>'point_value') IS NULL;
-- 3. Redefine exchange_loyalty_points to be dynamic
CREATE OR REPLACE FUNCTION public.exchange_loyalty_points(points_to_exchange INTEGER) RETURNS json AS $$
DECLARE v_user_id UUID;
v_current_points INTEGER;
v_wallet_id UUID;
v_amount NUMERIC;
v_rate NUMERIC;
BEGIN v_user_id := auth.uid();
-- Fetch rate from system_settings ('loyalty')
-- Default to 10 if setting is missing
SELECT COALESCE((value->>'point_value')::NUMERIC, 10.0) INTO v_rate
FROM public.system_settings
WHERE key = 'loyalty';
IF v_rate IS NULL THEN v_rate := 10.0;
END IF;
-- Check if user has enough points
SELECT loyalty_points INTO v_current_points
FROM public.profiles
WHERE id = v_user_id;
IF v_current_points IS NULL
OR v_current_points < points_to_exchange THEN RAISE EXCEPTION 'Points insuffisants. Vous avez % points.',
COALESCE(v_current_points, 0);
END IF;
-- Get Wallet
SELECT id INTO v_wallet_id
FROM public.wallets
WHERE user_id = v_user_id;
-- Create wallet if missing (defensive)
IF v_wallet_id IS NULL THEN
INSERT INTO public.wallets (user_id, balance, currency)
VALUES (v_user_id, 0, 'XOF')
RETURNING id INTO v_wallet_id;
END IF;
-- Calculate Amount
v_amount := points_to_exchange * v_rate;
-- Update Points
UPDATE public.profiles
SET loyalty_points = loyalty_points - points_to_exchange
WHERE id = v_user_id;
-- Credit Wallet
UPDATE public.wallets
SET balance = balance + v_amount,
    updated_at = NOW()
WHERE id = v_wallet_id;
-- Record Transaction
INSERT INTO public.transactions (wallet_id, amount, type, status, description)
VALUES (
        v_wallet_id,
        v_amount,
        'referral_conversion',
        'completed',
        'Conversion Fidélité: ' || points_to_exchange || ' pts (taux: ' || v_rate || ')'
    );
RETURN json_build_object(
    'success',
    true,
    'converted_points',
    points_to_exchange,
    'amount_credited',
    v_amount,
    'rate_used',
    v_rate,
    'new_balance',
    (
        SELECT balance
        FROM public.wallets
        WHERE id = v_wallet_id
    )
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;