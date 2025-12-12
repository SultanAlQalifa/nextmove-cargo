-- Function to pay with wallet balance
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
        p_user_id UUID,
        p_amount NUMERIC,
        p_ref_id TEXT,
        -- Shipment ID or Invoice ID
        p_description TEXT
    ) RETURNS JSONB AS $$
DECLARE v_wallet_id UUID;
v_balance NUMERIC;
v_new_balance NUMERIC;
BEGIN -- 1. Get Wallet
SELECT id,
    balance INTO v_wallet_id,
    v_balance
FROM public.wallets
WHERE user_id = p_user_id;
IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Portefeuille introuvable.';
END IF;
-- 2. Check Balance
IF v_balance < p_amount THEN RAISE EXCEPTION 'Solde insuffisant. Votre solde est de % %',
v_balance,
'FCFA';
END IF;
v_new_balance := v_balance - p_amount;
-- 3. Deduct Balance
UPDATE public.wallets
SET balance = v_new_balance,
    updated_at = now()
WHERE id = v_wallet_id;
-- 4. Record Transaction
INSERT INTO public.transactions (
        wallet_id,
        user_id,
        amount,
        type,
        status,
        description,
        reference_id,
        created_at
    )
VALUES (
        v_wallet_id,
        p_user_id,
        - p_amount,
        -- Negative amount for debit
        'debit',
        'completed',
        p_description,
        p_ref_id,
        now()
    );
RETURN jsonb_build_object(
    'success',
    true,
    'new_balance',
    v_new_balance,
    'message',
    'Paiement effectué avec succès'
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    SQLERRM
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.pay_with_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_with_wallet TO service_role;