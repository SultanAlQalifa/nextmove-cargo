-- CLEAN OLD TRANSACTIONS (Consolidated Robust Version)
-- This fixes the "400 Bad Request" by accepting optional JSON arguments.
-- 1. Drop ALL possible variations were may have created
DROP FUNCTION IF EXISTS public.clean_old_transactions();
DROP FUNCTION IF EXISTS public.clean_old_transactions(json);
DROP FUNCTION IF EXISTS public.expire_pending_transactions();
-- 2. Create the Universal Function
CREATE OR REPLACE FUNCTION public.clean_old_transactions(args json DEFAULT NULL) RETURNS boolean AS $$ BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO anon;
-- 4. Verification
SELECT public.clean_old_transactions('{}'::json);