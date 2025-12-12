-- Migration: Wallet and Transaction System
-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    balance numeric(12, 2) DEFAULT 0.00,
    currency text DEFAULT 'XOF',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id) -- One wallet per user
);
-- 2. Create Transactions Table
CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'referral_conversion',
    'payment',
    'refund'
);
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES public.wallets(id),
    amount numeric(12, 2) NOT NULL,
    -- Positive for credit, negative for debit
    type public.transaction_type NOT NULL,
    status public.transaction_status DEFAULT 'pending',
    reference_id text,
    -- External ref or related object ID
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 3. RLS Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR
SELECT USING (
        wallet_id IN (
            SELECT id
            FROM public.wallets
            WHERE user_id = auth.uid()
        )
    );
-- 4. Trigger to create wallet for new users (or handle in code)
-- We'll add a trigger to auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION public.create_new_user_wallet() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.wallets (user_id, balance, currency)
VALUES (NEW.id, 0.00, 'XOF') ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER create_wallet_on_profile_creation
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_new_user_wallet();
-- 5. Stored Procedure for Point Conversion (Atomic)
CREATE OR REPLACE FUNCTION public.convert_points_to_wallet(
        p_user_id uuid,
        p_points integer,
        p_conversion_rate numeric -- Value of 1 point in currency (e.g., 50)
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_points integer;
v_amount numeric;
BEGIN -- Check user points
SELECT referral_points INTO v_current_points
FROM public.profiles
WHERE id = p_user_id;
IF v_current_points < p_points THEN RAISE EXCEPTION 'Insufficient points: % available, % requested',
v_current_points,
p_points;
END IF;
-- Get Wallet ID
SELECT id INTO v_wallet_id
FROM public.wallets
WHERE user_id = p_user_id;
-- If wallet doesn't exist, create it (safe guard)
IF v_wallet_id IS NULL THEN
INSERT INTO public.wallets (user_id, balance)
VALUES (p_user_id, 0)
RETURNING id INTO v_wallet_id;
END IF;
-- Calculate Amount
v_amount := p_points * p_conversion_rate;
-- Start Transaction Block is implied in functions
-- 1. Deduct Points
UPDATE public.profiles
SET referral_points = referral_points - p_points
WHERE id = p_user_id;
-- 2. Credit Wallet
UPDATE public.wallets
SET balance = balance + v_amount,
    updated_at = now()
WHERE id = v_wallet_id;
-- 3. Record Transaction
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