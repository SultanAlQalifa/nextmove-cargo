-- Migration: Unified Points & Loyalty History System
-- 1. Create Point History Table
CREATE TABLE IF NOT EXISTS public.point_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    amount integer NOT NULL,
    -- Can be positive (earned) or negative (spent/converted)
    reason text NOT NULL,
    -- e.g., 'shipment_reward', 'referral_bonus', 'wallet_conversion', 'transfer_sent', 'transfer_received'
    related_id text,
    -- ID of the shipment, referral, or transaction
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR
SELECT USING (auth.uid() = user_id);
-- 2. Function to Log Point History (Helper)
CREATE OR REPLACE FUNCTION public.log_point_transaction(
        p_user_id uuid,
        p_amount integer,
        p_reason text,
        p_related_id text DEFAULT NULL,
        p_metadata jsonb DEFAULT '{}'::jsonb
    ) RETURNS void AS $$ BEGIN
INSERT INTO public.point_history (user_id, amount, reason, related_id, metadata)
VALUES (
        p_user_id,
        p_amount,
        p_reason,
        p_related_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Consolidated Wallet Conversion (Points -> Wallet)
CREATE OR REPLACE FUNCTION public.convert_points_to_wallet_v2(p_amount integer) RETURNS json AS $$
DECLARE v_user_id uuid;
v_current_points integer;
v_point_value numeric;
v_wallet_amount numeric;
v_wallet_id uuid;
BEGIN v_user_id := auth.uid();
-- Get system point value (default 10 FCFA)
SELECT COALESCE((value->>'point_value')::numeric, 10) INTO v_point_value
FROM public.system_settings
WHERE key = 'loyalty';
v_point_value := COALESCE(v_point_value, 10);
-- Check balance
SELECT loyalty_points INTO v_current_points
FROM public.profiles
WHERE id = v_user_id;
IF v_current_points < p_amount THEN RAISE EXCEPTION 'Solde insuffisant';
END IF;
-- Deduct Points
UPDATE public.profiles
SET loyalty_points = loyalty_points - p_amount
WHERE id = v_user_id;
-- Log History
PERFORM public.log_point_transaction(v_user_id, - p_amount, 'wallet_conversion', null);
-- Credit Wallet
v_wallet_amount := p_amount * v_point_value;
SELECT id INTO v_wallet_id
FROM public.wallets
WHERE user_id = v_user_id;
IF v_wallet_id IS NULL THEN
INSERT INTO public.wallets (user_id, balance)
VALUES (v_user_id, 0)
RETURNING id INTO v_wallet_id;
END IF;
UPDATE public.wallets
SET balance = balance + v_wallet_amount,
    updated_at = now()
WHERE id = v_wallet_id;
-- Log Transaction
INSERT INTO public.transactions (wallet_id, amount, type, status, description)
VALUES (
        v_wallet_id,
        v_wallet_amount,
        'referral_conversion',
        'completed',
        'Conversion ' || p_amount || ' pts'
    );
RETURN json_build_object('success', true, 'amount', v_wallet_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. P2P Point Transfer Function
CREATE OR REPLACE FUNCTION public.transfer_points(recipient_email text, amount integer) RETURNS json AS $$
DECLARE v_sender_id uuid;
v_recipient_id uuid;
v_sender_points integer;
BEGIN v_sender_id := auth.uid();
-- Validate self-transfer
IF amount <= 0 THEN RAISE EXCEPTION 'Montant invalide';
END IF;
-- Get Recipient
SELECT id INTO v_recipient_id
FROM public.profiles
WHERE email = recipient_email;
IF v_recipient_id IS NULL THEN RAISE EXCEPTION 'Utilisateur introuvable';
END IF;
IF v_recipient_id = v_sender_id THEN RAISE EXCEPTION 'Transfert impossible vers soi-même';
END IF;
-- Check Balance
SELECT loyalty_points INTO v_sender_points
FROM public.profiles
WHERE id = v_sender_id;
IF v_sender_points < amount THEN RAISE EXCEPTION 'Solde insuffisant';
END IF;
-- Execute Transfer
UPDATE public.profiles
SET loyalty_points = loyalty_points - amount
WHERE id = v_sender_id;
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + amount
WHERE id = v_recipient_id;
-- Log for Sender
PERFORM public.log_point_transaction(
    v_sender_id,
    - amount,
    'transfer_sent',
    v_recipient_id::text,
    jsonb_build_object('recipient_email', recipient_email)
);
-- Log for Recipient
PERFORM public.log_point_transaction(
    v_recipient_id,
    amount,
    'transfer_received',
    v_sender_id::text,
    jsonb_build_object('sender_id', v_sender_id)
);
RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Automated Referral Reward Trigger (When Referee completes 1st shipment)
CREATE OR REPLACE FUNCTION public.process_referral_reward() RETURNS TRIGGER AS $$
DECLARE v_referral_record public.referrals %ROWTYPE;
v_bonus_points integer := 500;
-- Configurable
BEGIN -- Only process on 'delivered'
IF NEW.status = 'delivered'
AND OLD.status != 'delivered' THEN -- Check if this user was referred and reward is pending
SELECT * INTO v_referral_record
FROM public.referrals
WHERE referred_id = NEW.client_id
    AND status = 'pending';
IF v_referral_record.id IS NOT NULL THEN -- Update Referral Status
UPDATE public.referrals
SET status = 'rewarded',
    points_earned = v_bonus_points,
    updated_at = now()
WHERE id = v_referral_record.id;
-- Award Points to Referrer
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + v_bonus_points
WHERE id = v_referral_record.referrer_id;
-- Log History for Referrer
PERFORM public.log_point_transaction(
    v_referral_record.referrer_id,
    v_bonus_points,
    'referral_bonus',
    v_referral_record.id::text
);
END IF;
-- Also Award standard loyalty points to the User (Shipment Reward)
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + 50
WHERE id = NEW.client_id;
PERFORM public.log_point_transaction(
    NEW.client_id,
    50,
    'shipment_reward',
    NEW.id::text
);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Re-attach trigger
DROP TRIGGER IF EXISTS tr_process_shipment_rewards ON public.shipments;
CREATE TRIGGER tr_process_shipment_rewards
AFTER
UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.process_referral_reward();