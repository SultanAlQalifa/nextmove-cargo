-- Migration: Fix referrals foreign keys for cascade delete
-- Description: Updates the referrals table to allow deleting users referencing it by adding ON DELETE CASCADE to foreign keys.
BEGIN;
-- Drop existing constraints
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey,
    DROP CONSTRAINT IF EXISTS referrals_referred_id_fkey;
-- Re-add constraints with ON DELETE CASCADE
ALTER TABLE public.referrals
ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.referrals
ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
COMMIT;