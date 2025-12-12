-- EXPIRE OLD PENDING TRANSACTIONS
-- Function to automatically mark 'pending' transactions as 'failed' if they are older than 3 minutes.
-- This enforces the user's rule: "3mn max".
CREATE OR REPLACE FUNCTION public.expire_pending_transactions() RETURNS void AS $$ BEGIN
UPDATE public.transactions
SET status = 'failed',
    updated_at = now()
WHERE status = 'pending'
    AND created_at < (now() - INTERVAL '3 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;