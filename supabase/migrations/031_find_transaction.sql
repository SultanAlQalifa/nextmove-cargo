-- Find any transaction with amount = 5
SELECT *
FROM transactions
WHERE amount = 5;
-- Also check for any transaction created in the last 48 hours to see what's there
SELECT *
FROM transactions
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;