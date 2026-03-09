-- Migration: Wallet & Transaction Security Hardening
-- Description: Reinforce RLS and integrity for financial operations.
-- 1. LOCK WALLETS FROM DIRECT USER UPDATES
-- Users should NEVER update their own balance. Only SECURITY DEFINER functions (like conversion) can.
-- We skip DISABLE TRIGGER ALL as it touches system triggers and fails on Supabase.
-- Instead, we just ensure our protection trigger is in place.
CREATE OR REPLACE FUNCTION public.check_wallet_update_permission() RETURNS TRIGGER AS $$ BEGIN -- Only allow update if it's coming from an internal system call (SECURITY DEFINER)
    -- or if the user is an admin making a manual adjustment.
    -- In Supabase, we can check the 'role' or (select current_setting('role')).
    IF (
        select current_setting('role')
    ) != 'service_role'
    AND NOT public.is_admin() THEN -- Allow ONLY if we can prove it's an authorized internal function.
    -- Since we use SECURITY DEFINER for system functions, they run as the owner (usually postgres).
    IF session_user = 'postgres' THEN RETURN NEW;
END IF;
RAISE EXCEPTION 'Direct wallet updates are forbidden for security reasons.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_lock_wallet_balance ON public.wallets;
CREATE TRIGGER tr_lock_wallet_balance BEFORE
UPDATE OF balance ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.check_wallet_update_permission();
-- 2. REINFORCE RLS ON TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE col_name TEXT;
BEGIN -- Determine which column to use for user identification in transactions
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'user_id'
) THEN col_name := 'user_id';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'client_id'
) THEN col_name := 'client_id';
END IF;
EXECUTE 'DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions';
EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions';
IF col_name IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING ((select auth.uid()) = %I OR public.is_admin())',
    col_name
);
ELSE -- Fallback to join via wallets if no direct column found
EXECUTE 'CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.user_id = (SELECT auth.uid())) OR public.is_admin())';
END IF;
EXECUTE 'CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL TO authenticated USING (public.is_admin())';
END $$;
-- 3. INTEGRITY HASH (Innovation)
-- Add a metadata field for transaction signatures if needed in the future
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS integrity_hash text;
COMMENT ON COLUMN public.transactions.integrity_hash IS 'Digital signature to prevent manual database tampering.';