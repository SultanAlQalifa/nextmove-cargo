-- Verify Data and RPC Function
-- 1. Check Profiles Count
SELECT count(*) as total_profiles
FROM profiles;
-- 2. Check Transactions
SELECT *
FROM transactions;
-- 3. Test get_dashboard_stats directly
SELECT get_dashboard_stats();