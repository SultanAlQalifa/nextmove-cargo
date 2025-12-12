-- FIX RPC FUNCTION & PERMISSIONS
-- Re-creates the expiry function and ensures the 'authenticated' (logged in users) role can run it.
-- 1. Drop existing to ensure clean slate
DROP FUNCTION IF EXISTS public.expire_pending_transactions();
-- 2. Create the function
CREATE OR REPLACE FUNCTION public.expire_pending_transactions() RETURNS void AS $$ BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. KEY STEP: Grant permission to logged-in users
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO service_role;
-- 4. Verify it exists
SELECT routines.routine_name
FROM information_schema.routines
WHERE routines.routine_name = 'expire_pending_transactions';