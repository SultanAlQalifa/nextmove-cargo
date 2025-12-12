-- Migration to add 'wallet' as a payment gateway
-- 1. Add 'wallet' to the gateway_provider ENUM if not present
DO $$ BEGIN ALTER TYPE public.gateway_provider
ADD VALUE IF NOT EXISTS 'wallet';
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. Insert the Wallet Gateway
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM public.payment_gateways
    WHERE provider = 'wallet'
) THEN
INSERT INTO public.payment_gateways (
        id,
        name,
        provider,
        is_active,
        is_test_mode,
        transaction_fee_percent,
        supported_currencies,
        config
    )
VALUES (
        gen_random_uuid(),
        'Portefeuille',
        'wallet',
        true,
        false,
        0,
        ARRAY ['XOF'],
        '{}'::jsonb
    );
END IF;
END $$;