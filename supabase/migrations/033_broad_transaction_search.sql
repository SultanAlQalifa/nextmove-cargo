-- Broad search for ANY transactions
SELECT *
FROM transactions;
-- Check if there are any profiles created recently (to see if user creation worked)
SELECT *
FROM profiles
ORDER BY created_at DESC
LIMIT 5;