-- Fix for: column "type" of relation "transactions" does not exist
-- Also ensures updated_at and user_id exist for cleanup functions
-- 1. Ensure Types exist (Robustly)
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
-- 2. Add 'type' column to transactions if it is missing
DO $$ BEGIN
ALTER TABLE public.transactions
ADD COLUMN type public.transaction_type NOT NULL DEFAULT 'payment';
EXCEPTION
WHEN duplicate_column THEN null;
END $$;
-- 3. Add 'status' column to transactions if it is missing
DO $$ BEGIN
ALTER TABLE public.transactions
ADD COLUMN status public.transaction_status NOT NULL DEFAULT 'pending';
EXCEPTION
WHEN duplicate_column THEN null;
END $$;
-- 4. Add 'reference_id' column if missing
DO $$ BEGIN
ALTER TABLE public.transactions
ADD COLUMN reference_id text;
EXCEPTION
WHEN duplicate_column THEN null;
END $$;
-- 5. Add 'updated_at' column if missing (needed for cleanup logic)
DO $$ BEGIN
ALTER TABLE public.transactions
ADD COLUMN updated_at timestamptz DEFAULT now();
EXCEPTION
WHEN duplicate_column THEN null;
END $$;
-- 6. Add 'user_id' column if missing
DO $$ BEGIN
ALTER TABLE public.transactions
ADD COLUMN user_id UUID REFERENCES public.profiles(id);
EXCEPTION
WHEN duplicate_column THEN null;
END $$;
-- 7. Backfill user_id from wallet if missing
UPDATE public.transactions t
SET user_id = w.user_id
FROM public.wallets w
WHERE t.wallet_id = w.id
    AND t.user_id IS NULL;