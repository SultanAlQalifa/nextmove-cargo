-- 1. Automate Point Attribution on Shipment Delivery
CREATE OR REPLACE FUNCTION public.award_loyalty_points_on_delivery() RETURNS TRIGGER AS $$ BEGIN -- Only award points if status changed to 'delivered' and wasn't 'delivered' before
    IF NEW.status = 'delivered'
    AND OLD.status != 'delivered' THEN -- Award 50 points to the client
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + 50
WHERE id = NEW.client_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger definition
DROP TRIGGER IF EXISTS tr_award_loyalty_points ON public.shipments;
CREATE TRIGGER tr_award_loyalty_points
AFTER
UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points_on_delivery();
-- 2. Function to Convert Loyalty Points to Wallet Money
-- Rate: 1 Point = 10 XOF
CREATE OR REPLACE FUNCTION public.exchange_loyalty_points(points_to_exchange INTEGER) RETURNS json AS $$
DECLARE v_user_id UUID;
v_current_points INTEGER;
v_wallet_id UUID;
v_amount NUMERIC;
v_rate NUMERIC := 10.0;
-- 10 XOF per point
BEGIN v_user_id := auth.uid();
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
        -- Using existing enum type or 'deposit' if strict
        'completed',
        'Conversion Fidélité: ' || points_to_exchange || ' pts'
    );
RETURN json_build_object(
    'success',
    true,
    'converted_points',
    points_to_exchange,
    'amount_credited',
    v_amount,
    'new_balance',
    (
        SELECT balance
        FROM public.wallets
        WHERE id = v_wallet_id
    )
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;