-- Fix wallet trigger and admin_adjust_wallet RPC to prevent "Direct wallet updates are forbidden" errors
-- 1. Update the trigger to allow bypass via local setting
CREATE OR REPLACE FUNCTION public.check_wallet_update_permission() RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public,
    pg_temp AS $$ BEGIN -- Allow update if it's coming from an internal system call (service_role)
    -- or if the bypass flag is set explicitly by an authorized RPC
    IF (select current_setting('role')) = 'service_role'
    OR (select current_setting('wallet.allow_direct_update', true)) = 'true' THEN RETURN NEW;
END IF;
-- Allow if the user is a super-admin (using a safe query to avoid nested security definer issues)
IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = nullif(
            (select current_setting('request.jwt.claim.sub', true)),
            ''
        )::uuid
        AND role IN ('admin', 'super-admin')
) THEN RETURN NEW;
END IF;
-- Legacy checks just in case
IF session_user IN ('postgres', 'supabase_admin') THEN RETURN NEW;
END IF;
RAISE EXCEPTION 'Direct wallet updates are forbidden for security reasons. Please use proper RPC functions.';
END;
$$;
-- 2. Update admin_adjust_wallet to use the bypass natively
DROP FUNCTION IF EXISTS public.admin_adjust_wallet(UUID, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
        p_user_id UUID,
        p_amount NUMERIC,
        p_type TEXT,
        p_description TEXT
    ) RETURNS JSONB AS $$
DECLARE v_wallet_id UUID;
v_current_balance NUMERIC;
v_new_balance NUMERIC;
v_amount_adjusted NUMERIC;
v_caller_role TEXT;
BEGIN -- 0. Security Check using raw claims to avoid nested SD (select auth.uid()) issues
SELECT role INTO v_caller_role
FROM public.profiles
WHERE id = nullif(
        (select current_setting('request.jwt.claim.sub', true)),
        ''
    )::uuid;
IF v_caller_role NOT IN ('admin', 'super-admin') THEN RAISE EXCEPTION 'Accès refusé. Réservé aux Administrateurs et Super Admins.';
END IF;
-- 1. Get Wallet
SELECT id,
    balance INTO v_wallet_id,
    v_current_balance
FROM public.wallets
WHERE user_id = p_user_id;
IF v_wallet_id IS NULL THEN -- Create wallet if missing (auto-fix)
-- Temporarily allow bypass for insertion if needed, though trigger is on UPDATE
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
-- Pre-validate balance to avoid raw database constraint error
IF v_new_balance < 0 THEN RAISE EXCEPTION 'Fonds insuffisants. Le solde actuel (%) ne permet pas un retrait de %.',
v_current_balance,
p_amount;
END IF;
-- Enable bypass for the trigger during this transaction
PERFORM set_config('wallet.allow_direct_update', 'true', true);
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
        reference,
        method,
        created_at
    )
VALUES (
        v_wallet_id,
        p_user_id,
        p_amount,
        -- Always insert positive amount for transaction record
        p_type::public.transaction_type,
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp;
-- Ensure execute grants
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet TO service_role;