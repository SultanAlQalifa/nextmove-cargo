-- RPC to process a refund
-- It should:
-- 1. Check transaction exists
-- 2. Update transaction status (or create a refund transaction linked to it)
-- 3. Credit user wallet
CREATE OR REPLACE FUNCTION process_refund(
        p_transaction_id UUID,
        p_amount DECIMAL,
        p_reason TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID;
v_wallet_id UUID;
v_current_balance DECIMAL;
v_transaction RECORD;
BEGIN -- Get Transaction
SELECT * INTO v_transaction
FROM transactions
WHERE id = p_transaction_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found';
END IF;
v_user_id := v_transaction.user_id;
-- Get User Wallet
SELECT id,
    balance INTO v_wallet_id,
    v_current_balance
FROM wallets
WHERE user_id = v_user_id;
IF NOT FOUND THEN -- If no wallet, we might need to create one or error. For now error.
RAISE EXCEPTION 'User wallet not found';
END IF;
-- Credit Wallet
UPDATE wallets
SET balance = balance + p_amount,
    updated_at = NOW()
WHERE id = v_wallet_id;
-- Record Refund Transaction
INSERT INTO transactions (
        user_id,
        wallet_id,
        amount,
        currency,
        type,
        status,
        method,
        reference,
        description,
        metadata
    )
VALUES (
        v_user_id,
        v_wallet_id,
        p_amount,
        v_transaction.currency,
        'deposit',
        -- Refund acts as a deposit to wallet
        'completed',
        'system_transfer',
        -- or 'refund'
        'REF-' || floor(
            extract(
                epoch
                from now()
            )
        ),
        'Remboursement: ' || p_reason,
        jsonb_build_object(
            'original_transaction_id',
            p_transaction_id,
            'reason',
            p_reason
        )
    );
-- Optionally update original transaction status if full refund
-- IF p_amount >= v_transaction.amount THEN
--   UPDATE transactions SET status = 'refunded' WHERE id = p_transaction_id;
-- END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'new_balance',
    v_current_balance + p_amount
);
END;
$$;