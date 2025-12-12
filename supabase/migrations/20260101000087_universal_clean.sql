-- CLEAN OLD TRANSACTIONS (v4 - Universal Signature)
-- This fixes the "400 Bad Request" by accepting ANY arguments (even though we ignore them).
-- This handles cases where the client sends an empty object {} by default.
DROP FUNCTION IF EXISTS public.clean_old_transactions();
DROP FUNCTION IF EXISTS public.clean_old_transactions(json);
-- Universal Function: Accepts an optional JSON argument but ignores it.
CREATE OR REPLACE FUNCTION public.clean_old_transactions(args json DEFAULT NULL) RETURNS boolean AS $$ BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant Permissions
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_transactions(json) TO anon;
SELECT clean_old_transactions('{}'::json);