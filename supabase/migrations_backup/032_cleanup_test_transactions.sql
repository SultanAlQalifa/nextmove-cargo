-- Cleanup Script: Delete test transactions
-- Deletes transactions with the specific test pattern we created
DELETE FROM transactions
WHERE reference LIKE 'txn_test_%'
    AND amount = 50000;
-- Verify if the 5 XOF transaction exists
SELECT *
FROM transactions
WHERE amount = 5;