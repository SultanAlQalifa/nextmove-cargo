-- Fix: Add SECURITY DEFINER to wallet creation trigger
-- This allows the trigger to create a wallet even if the user invoking it (via Profile creation)
-- does not have direct INSERT permissions on the 'wallets' table (which is correct for security).
CREATE OR REPLACE FUNCTION public.create_new_user_wallet() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.wallets (user_id, balance, currency)
VALUES (NEW.id, 0.00, 'XOF') ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Re-ensure the trigger is bound (idempotent)
DROP TRIGGER IF EXISTS create_wallet_on_profile_creation ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_creation
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_new_user_wallet();