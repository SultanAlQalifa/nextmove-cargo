-- Fix Infinite Recursion in RLS Policies
-- The previous policy queried 'profiles' within the 'profiles' policy, causing a loop.
-- 1. Create a secure function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE current_role text;
BEGIN
SELECT role INTO current_role
FROM profiles
WHERE id = auth.uid();
RETURN current_role IN ('admin', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Fix PROFILES Policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR
SELECT USING (is_admin());
-- 3. Fix USER_SUBSCRIPTIONS Policy (Safe to use is_admin here too)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR
SELECT USING (is_admin());
-- 4. Fix TRANSACTIONS Policy
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR
SELECT USING (is_admin());
-- 5. Fix INVOICES Policy
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices" ON invoices FOR
SELECT USING (is_admin());