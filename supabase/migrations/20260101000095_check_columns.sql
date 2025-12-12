-- CHECK TABLE SCHEMA
-- This script lists all columns in the 'transactions' table to check if we have 'reference' or 'reference_id'.
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'transactions'
ORDER BY column_name;