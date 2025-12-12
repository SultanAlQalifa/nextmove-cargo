-- FIX RPC FUNCTION V2 (ROBUST)
-- This checks if the previous one exists, drops it, and creates a new one returning usage stats.
-- It also forces the permissions.
-- 1. Drop validation
DROP FUNCTION IF EXISTS public.expire_pending_transactions();
-- 2. Create function that returns the number of expired rows (better for debugging)
CREATE OR REPLACE FUNCTION public.expire_pending_transactions() RETURNS json AS $$
DECLARE rows_affected integer;
BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
GET DIAGNOSTICS rows_affected = ROW_COUNT;
RETURN json_build_object('expired_count', rows_affected);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Grant Permissions (CRITICAL)
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO postgres;
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO anon;
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_transactions() TO service_role;
-- 4. Verify output
SELECT 'Function created successfully' as status;