-- CHECK COLUMN USAGE
-- See which column is being used: reference or reference_id
SELECT created_at,
    amount,
    status,
    reference,
    reference_id,
    metadata
FROM transactions
ORDER BY created_at DESC
LIMIT 5;