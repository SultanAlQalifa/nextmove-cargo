-- DEBUG SCRIPT: WAVE STATUS
-- Run this to see the raw truth of what is stored and what is happening.
-- 1. INSPECT GATEWAY CONFIG
-- Check if 'secret_key' starts with 'wave_live_' or 'wave_test_'
SELECT name,
    provider,
    is_test_mode,
    config->>'merchant_id' as merchant_id,
    CASE
        WHEN config->>'secret_key' LIKE 'wave_live_%' THEN 'LIVE_KEY_DETECTED'
        WHEN config->>'secret_key' LIKE 'wave_test_%' THEN 'TEST_KEY_DETECTED'
        ELSE 'UNKNOWN_FORMAT'
    END as key_type_check
FROM payment_gateways
WHERE provider = 'wave';
-- 2. INSPECT LAST TRANSACTIONS
-- See the 'metadata' column. It often contains the 'wave_session' which shows real status.
SELECT created_at,
    amount,
    status,
    metadata
FROM transactions
ORDER BY created_at DESC
LIMIT 3;