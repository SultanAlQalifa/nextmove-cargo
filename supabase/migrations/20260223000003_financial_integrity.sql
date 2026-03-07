-- Migration: Wallet & Transaction Security Hardening
-- Description: Reinforce RLS and integrity for financial operations.
-- 1. LOCK WALLETS FROM DIRECT USER UPDATES
-- Users should NEVER update their own balance. Only SECURITY DEFINER functions (like conversion) can.
ALTER TABLE public.wallets DISABLE TRIGGER ALL;
-- Disable any client-side potential triggers
CREATE OR REPLACE FUNCTION public.check_wallet_update_permission() RETURNS TRIGGER AS $$ BEGIN -- Only allow update if it's coming from an internal system call (SECURITY DEFINER)
    -- or if the user is an admin making a manual adjustment.
    -- In Supabase, we can check the 'role' or (select current_setting('role')).
    IF (select current_setting('role')) != 'service_role'
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
-- Clear old policies if any
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR
SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (public.is_admin());
-- 3. INTEGRITY HASH (Innovation)
-- Add a metadata field for transaction signatures if needed in the future
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS integrity_hash text;
COMMENT ON COLUMN public.transactions.integrity_hash IS 'Digital signature to prevent manual database tampering.';