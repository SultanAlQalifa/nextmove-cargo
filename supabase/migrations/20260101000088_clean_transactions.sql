-- CLEAN OLD TRANSACTIONS (v3 - Returns Boolean)
-- Returns 'true' to avoid 400 Bad Request on empty responses
-- Run this in Supabase SQL Editor
-- 1. Scan and Drop any previous conflicting functions
DROP FUNCTION IF EXISTS public.clean_old_transactions();
DROP FUNCTION IF EXISTS public.expire_pending_transactions();
-- 2. Create function that returns TRUE
CREATE OR REPLACE FUNCTION public.clean_old_transactions() RETURNS boolean AS $$ BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Grant Permissions Explicitly
GRANT EXECUTE ON FUNCTION public.clean_old_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions() TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions() TO anon;
-- 4. Verification
SELECT clean_old_transactions();