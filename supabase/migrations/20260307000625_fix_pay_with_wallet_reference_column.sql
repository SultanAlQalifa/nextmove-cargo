-- Fix column mapping in pay_with_wallet function
DROP FUNCTION IF EXISTS public.pay_with_wallet(uuid, numeric, text, text);
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
        p_user_id uuid,
        p_amount numeric,
        p_ref_id text,
        p_description text
    ) RETURNS json AS $$
DECLARE v_wallet_id uuid;
v_current_balance numeric;
BEGIN -- SECURITY CHECK
IF p_user_id != (
    select auth.uid()
) THEN RAISE EXCEPTION 'Unauthorized: You can only pay with your own wallet';
END IF;
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
-- Bypassing the wallet direct update block for this legitimate RPC operation
PERFORM set_config('wallet.allow_direct_update', 'true', true);
UPDATE public.wallets
SET balance = balance - p_amount,
    updated_at = now()
WHERE id = v_wallet_id;
INSERT INTO public.transactions (
        wallet_id,
        amount,
        type,
        status,
        reference,
        -- Changed from reference_id to reference
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
-- Ensure execute grants
GRANT EXECUTE ON FUNCTION public.pay_with_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_with_wallet TO service_role;