-- VERIFICATION DE LA CLE WAVE
-- Ce script va lire la clé stockée en base de données et vous dire si c'est une clé TEST ou LIVE.
-- Il n'affiche que les 10 premiers caractères pour la sécurité.
SELECT name,
    CASE
        WHEN config->>'secret_key' LIKE 'wave_live_%'
        OR config->>'secret_key' LIKE 'wave_sn_prod_%' THEN '✅ MODE LIVE DETECTÉ (Production SN)'
        WHEN config->>'secret_key' LIKE 'wave_test_%' THEN '⚠️ MODE TEST ACTIF (wave_test_...)'
        ELSE '❓ FORMAT INCONNU: ' || LEFT(config->>'secret_key', 15)
    END as DIAGNOSTIC_CLE,
    config->>'merchant_id' as ID_MARCHAND
FROM payment_gateways
WHERE provider = 'wave';