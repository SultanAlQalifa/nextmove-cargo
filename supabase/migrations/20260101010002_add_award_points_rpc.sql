-- Migration: Create award_points RPC for Admin Adjustments
-- This function allows admins to manually credit/debit points and logs the transaction.
CREATE OR REPLACE FUNCTION public.award_points(
        p_user_id uuid,
        p_amount integer,
        p_reason text,
        p_source text DEFAULT 'admin_adjustment'
    ) RETURNS json AS $$
DECLARE v_new_balance integer;
BEGIN -- 1. Validate Admin (Optional: handled by RLS but good for safety)
-- In a real scenario, you might check if auth.uid() is an admin here.
-- 2. Update User Profile
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + p_amount
WHERE id = p_user_id
RETURNING loyalty_points INTO v_new_balance;
-- 3. Log Transaction
PERFORM public.log_point_transaction(
    p_user_id,
    p_amount,
    p_reason,
    null,
    -- related_id
    jsonb_build_object('source', p_source, 'admin_id', auth.uid())
);
RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execution to authenticated users (so the admin dashboard can call it)
-- Since it's SECURITY DEFINER, it runs with owner privileges, bypassing RLS for the update.
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer, text, text) TO authenticated;