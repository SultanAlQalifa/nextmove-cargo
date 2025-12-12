-- FORCE PRODUCTION MODE
-- This script disables 'is_test_mode' for ALL payment gateways.
-- It enforces a strict "Live Only" environment.
BEGIN;
-- 1. Force Wave to LIVE
UPDATE public.payment_gateways
SET is_test_mode = false,
    updated_at = now()
WHERE provider = 'wave';
-- 2. Force Wallet to LIVE (Standard behavior, removing any ambiguity)
UPDATE public.payment_gateways
SET is_test_mode = false,
    updated_at = now()
WHERE provider = 'wallet';
-- 3. Ensure any other future gateway is also Live
UPDATE public.payment_gateways
SET is_test_mode = false;
COMMIT;
-- Verification Output
SELECT name,
    provider,
    is_test_mode
FROM public.payment_gateways;