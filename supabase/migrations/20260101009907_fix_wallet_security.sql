-- Security Patch: Fix IDOR vulnerabilities in Wallet functions
-- Enforce that users can only operate on their own wallets
-- 1. Secure convert_points_to_wallet
CREATE OR REPLACE FUNCTION public.convert_points_to_wallet(
        p_user_id uuid,
        p_points integer,
        p_conversion_rate numeric
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_points integer;
v_amount numeric;
BEGIN -- SECURITY CHECK
IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: You can only convert your own points';
END IF;
SELECT referral_points INTO v_current_points
FROM public.profiles
WHERE id = p_user_id;
IF v_current_points < p_points THEN RAISE EXCEPTION 'Insufficient points: % available, % requested',
v_current_points,
p_points;
END IF;
SELECT id INTO v_wallet_id
FROM public.wallets
WHERE user_id = p_user_id;
IF v_wallet_id IS NULL THEN
INSERT INTO public.wallets (user_id, balance)
VALUES (p_user_id, 0)
RETURNING id INTO v_wallet_id;
END IF;
v_amount := p_points * p_conversion_rate;
UPDATE public.profiles
SET referral_points = referral_points - p_points
WHERE id = p_user_id;
UPDATE public.wallets
SET balance = balance + v_amount,
    updated_at = now()
WHERE id = v_wallet_id;
INSERT INTO public.transactions (wallet_id, amount, type, status, description)
VALUES (
        v_wallet_id,
        v_amount,
        'referral_conversion',
        'completed',
        'Conversion de ' || p_points || ' points'
    );
RETURN json_build_object(
    'success',
    true,
    'new_balance',
    (v_amount),
    'converted_amount',
    v_amount
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Secure pay_with_wallet
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
        p_user_id uuid,
        p_amount numeric,
        p_ref_id text,
        p_description text
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_balance numeric;
BEGIN -- SECURITY CHECK
IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: You can only pay with your own wallet';
END IF;
SELECT id,
    balance INTO v_wallet_id,
    v_current_balance
FROM public.wallets
WHERE user_id = p_user_id FOR
UPDATE;
IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found';
END IF;
IF v_current_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
UPDATE public.wallets
SET balance = balance - p_amount,
    updated_at = now()
WHERE id = v_wallet_id;
INSERT INTO public.transactions (
        wallet_id,
        amount,
        type,
        status,
        reference_id,
        description
    )
VALUES (
        v_wallet_id,
        p_amount,
        'payment',
        'completed',
        p_ref_id,
        p_description
    );
RETURN json_build_object(
    'success',
    true,
    'new_balance',
    v_current_balance - p_amount
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;