-- ═══════════════════════════════════════════════════════════════
-- Strict Data Isolation Enforcement (REVISED)
-- Fixes Recursion Error by using is_admin() function
-- ═══════════════════════════════════════════════════════════════
-- 1. PROFILES ISOLATION
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can see all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (
        auth.uid() = id
        OR is_admin() -- Use the helper function to avoid recursion!
    );
-- 2. SUBSCRIPTIONS ISOLATION
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR
SELECT USING (
        auth.uid() = user_id
        OR is_admin()
    );
-- 3. TRANSACTIONS ISOLATION
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (
        auth.uid() = user_id
        OR is_admin()
    );