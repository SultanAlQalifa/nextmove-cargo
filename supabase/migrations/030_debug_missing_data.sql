-- Debug Script: Find missing transaction and check KYC status
-- 1. Search for the 5 XOF transaction (or any recent transaction)
SELECT *
FROM transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
-- 2. Check the profile status for 'afriflux@gmail.com'
SELECT id,
    email,
    role,
    verification_status,
    account_status
FROM profiles
WHERE email = 'afriflux@gmail.com';
-- 3. Check if any documents exist for this user
SELECT *
FROM forwarder_documents
WHERE forwarder_id = (
        SELECT id
        FROM profiles
        WHERE email = 'afriflux@gmail.com'
    );