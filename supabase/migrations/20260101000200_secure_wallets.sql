-- Migration: Secure Wallet RLS Policies
-- Purpose: Restrict 'admin' role from accessing wallets/transactions, while allowing 'super-admin' and owners.
-- 1. Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
-- 2. Create Helper Function to check role (Optional but cleaner, or we use direct joins)
-- Using direct joins for portability and simplicity in this migration.
-- 3. New Policy for WALLETS
-- Allow read if:
-- (User is owner) AND (Role is NOT 'admin')
-- OR
-- (Role is 'super-admin')
CREATE POLICY "Secure Wallet Access" ON public.wallets FOR
SELECT USING (
        (
            -- Case 1: Owner Access (but NOT if simple admin)
            auth.uid() = user_id
            AND EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = auth.uid()
                    AND role != 'admin' -- Explicitly block 'admin' role even if they own the wallet (though admins shouldn't really use the platform as users usually)
            )
        )
        OR (
            -- Case 2: Super-Admin Access (Platform Bank)
            EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = auth.uid()
                    AND role = 'super-admin'
            )
        )
    );
-- 4. New Policy for TRANSACTIONS
CREATE POLICY "Secure Transaction Access" ON public.transactions FOR
SELECT USING (
        (
            -- Case 1: Owner Access (via wallet ownership)
            wallet_id IN (
                SELECT id
                FROM public.wallets
                WHERE user_id = auth.uid()
            )
            AND EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = auth.uid()
                    AND role != 'admin'
            )
        )
        OR (
            -- Case 2: Super-Admin Access
            EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = auth.uid()
                    AND role = 'super-admin'
            )
        )
    );
-- Comments to confirm applied changes
COMMENT ON TABLE public.wallets IS 'Secured: Admin role excluded from access via RLS';