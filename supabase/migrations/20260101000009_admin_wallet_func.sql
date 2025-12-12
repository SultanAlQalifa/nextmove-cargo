-- Function for admins to manually credit/debit a wallet
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
        p_user_id UUID,
        p_amount NUMERIC,
        p_type TEXT,
        -- 'deposit' (credit) or 'withdrawal' (debit)
        p_description TEXT
    ) RETURNS JSONB AS $$
DECLARE v_wallet_id UUID;
v_current_balance NUMERIC;
v_new_balance NUMERIC;
v_amount_adjusted NUMERIC;
BEGIN -- 0. Security Check
IF (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
) != 'super-admin' THEN RAISE EXCEPTION 'Accès refusé. Réservé aux Super Admins.';
END IF;
-- 1. Get Wallet
SELECT id,
    balance INTO v_wallet_id,
    v_current_balance
FROM public.wallets
WHERE user_id = p_user_id;
IF v_wallet_id IS NULL THEN -- Create wallet if missing (auto-fix)
INSERT INTO public.wallets (user_id, balance)
VALUES (p_user_id, 0)
RETURNING id,
    balance INTO v_wallet_id,
    v_current_balance;
END IF;
-- 2. Calculate
IF p_type = 'deposit' THEN v_amount_adjusted := p_amount;
ELSIF p_type = 'withdrawal' THEN v_amount_adjusted := - p_amount;
ELSE RAISE EXCEPTION 'Invalid transaction type: %',
p_type;
END IF;
v_new_balance := v_current_balance + v_amount_adjusted;
-- 3. Update Wallet
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
        method,
        created_at
    )
VALUES (
        v_wallet_id,
        p_user_id,
        v_amount_adjusted,
        p_type::public.transaction_type,
        -- Cast to enum
        'completed',
        p_description,
        'ADMIN-' || floor(
            extract(
                epoch
                from now()
            )
        )::text,
        'manual',
        now()
    );
RETURN jsonb_build_object(
    'success',
    true,
    'new_balance',
    v_new_balance,
    'message',
    'Portefeuille mis à jour avec succès'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet TO service_role;