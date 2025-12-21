-- Migration to add PayTech, CinetPay, and Bank Transfer as payment gateways
-- 1. Add new providers to the gateway_provider ENUM
-- IMPORTANT: Run this block separately and COMMIT before running the INSERTs
DO $$ BEGIN ALTER TYPE public.gateway_provider
ADD VALUE IF NOT EXISTS 'paytech';
ALTER TYPE public.gateway_provider
ADD VALUE IF NOT EXISTS 'cinetpay';
ALTER TYPE public.gateway_provider
ADD VALUE IF NOT EXISTS 'bank_transfer';
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. Insert PayTech Gateway
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
SELECT gen_random_uuid(),
    'PayTech',
    'paytech',
    true,
    true,
    1.5,
    ARRAY ['XOF'],
    '{"merchant_id": "", "secret_key": ""}'::jsonb
WHERE NOT EXISTS (
        SELECT 1
        FROM public.payment_gateways
        WHERE provider = 'paytech'
    );
-- 3. Insert CinetPay Gateway
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
SELECT gen_random_uuid(),
    'CinetPay',
    'cinetpay',
    true,
    true,
    2.0,
    ARRAY ['XOF', 'XAF', 'GNF', 'USD'],
    '{"site_id": "", "apikey": ""}'::jsonb
WHERE NOT EXISTS (
        SELECT 1
        FROM public.payment_gateways
        WHERE provider = 'cinetpay'
    );
-- 4. Insert Bank Transfer Gateway (Banque Agricole)
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
SELECT gen_random_uuid(),
    'Virement Bancaire',
    'bank_transfer',
    true,
    false,
    0,
    ARRAY ['XOF', 'EUR', 'USD'],
    '{
    "bank_name": "Banque Agricole",
    "account_name": "",
    "iban": "",
    "swift": "",
    "instructions": "Veuillez effectuer le virement sur le compte ci-dessus et nous envoyer la preuve de paiement."
}'::jsonb
WHERE NOT EXISTS (
        SELECT 1
        FROM public.payment_gateways
        WHERE provider = 'bank_transfer'
    );