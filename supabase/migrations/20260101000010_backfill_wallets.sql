-- Migration: Backfill Wallets for Existing Users
-- This script creates a wallet for every user in existing 'profiles' 
-- who does not yet have a corresponding entry in 'wallets'.
INSERT INTO public.wallets (user_id, balance, currency)
SELECT id,
    0.00,
    'XOF'
FROM public.profiles
WHERE id NOT IN (
        SELECT user_id
        FROM public.wallets
    );
-- Notes:
-- RLS policies will automatically apply to these new rows.
-- The default balance is 0.00 XOF.