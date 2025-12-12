-- Fix for: column "type" of relation "transactions" does not exist
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