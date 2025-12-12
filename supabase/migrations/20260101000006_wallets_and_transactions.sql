-- Migration: Wallet and Transaction System
-- 1. Create Types (Idempotent)
DO $$ BEGIN CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'referral_conversion',
    'payment',
    'refund'
);
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    balance numeric(12, 2) DEFAULT 0.00,
    currency text DEFAULT 'XOF',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);
-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES public.wallets(id),
    amount numeric(12, 2) NOT NULL,
    type public.transaction_type NOT NULL,
    status public.transaction_status DEFAULT 'pending',
    reference_id text,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 4. RLS Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts on re-run
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR
SELECT USING (
        wallet_id IN (
            SELECT id
            FROM public.wallets
            WHERE user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE role IN ('admin', 'super-admin')
        )
    );
DROP POLICY IF EXISTS "Admins can update wallets" ON public.wallets;
CREATE POLICY "Admins can update wallets" ON public.wallets FOR
UPDATE USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE role IN ('admin', 'super-admin')
        )
    );
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE role IN ('admin', 'super-admin')
        )
    );
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE role IN ('admin', 'super-admin')
        )
    );
-- 5. Trigger for new users
DROP TRIGGER IF EXISTS create_wallet_on_profile_creation ON public.profiles;
DROP FUNCTION IF EXISTS public.create_new_user_wallet();
CREATE OR REPLACE FUNCTION public.create_new_user_wallet() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.wallets (user_id, balance, currency)
VALUES (NEW.id, 0.00, 'XOF') ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER create_wallet_on_profile_creation
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_new_user_wallet();
-- 6. Point Conversion Function
DROP FUNCTION IF EXISTS public.convert_points_to_wallet(uuid, integer, numeric);
CREATE OR REPLACE FUNCTION public.convert_points_to_wallet(
        p_user_id uuid,
        p_points integer,
        p_conversion_rate numeric
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_points integer;
v_amount numeric;
BEGIN
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
-- 7. Payment Function
DROP FUNCTION IF EXISTS public.pay_with_wallet(uuid, numeric, text, text);
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
        p_user_id uuid,
        p_amount numeric,
        p_ref_id text,
        p_description text
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_balance numeric;
BEGIN
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
-- 8. Admin Adjust Function
DROP FUNCTION IF EXISTS public.admin_adjust_wallet(uuid, numeric, text, text);
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
        p_user_id uuid,
        p_amount numeric,
        p_type text,
        p_description text
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_new_balance numeric;
BEGIN IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
        AND role IN ('admin', 'super-admin')
) THEN RAISE EXCEPTION 'Unauthorized';
END IF;
SELECT id INTO v_wallet_id
FROM public.wallets
WHERE user_id = p_user_id FOR
UPDATE;
IF v_wallet_id IS NULL THEN
INSERT INTO public.wallets (user_id, balance)
VALUES (p_user_id, 0)
RETURNING id INTO v_wallet_id;
END IF;
IF p_type = 'deposit' THEN
UPDATE public.wallets
SET balance = balance + p_amount,
    updated_at = now()
WHERE id = v_wallet_id
RETURNING balance INTO v_new_balance;
INSERT INTO public.transactions (wallet_id, amount, type, status, description)
VALUES (
        v_wallet_id,
        p_amount,
        'deposit',
        'completed',
        p_description
    );
ELSIF p_type = 'withdrawal' THEN
UPDATE public.wallets
SET balance = balance - p_amount,
    updated_at = now()
WHERE id = v_wallet_id
RETURNING balance INTO v_new_balance;
INSERT INTO public.transactions (wallet_id, amount, type, status, description)
VALUES (
        v_wallet_id,
        p_amount,
        'withdrawal',
        'completed',
        p_description
    );
ELSE RAISE EXCEPTION 'Invalid adjustment type';
END IF;
RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 9. Backfill wallets (Run last to ensure tables exist)
INSERT INTO public.wallets (user_id, balance, currency)
SELECT id,
    0.00,
    'XOF'
FROM public.profiles
WHERE id NOT IN (
        SELECT user_id
        FROM public.wallets
    ) ON CONFLICT (user_id) DO NOTHING;