-- Fix Admin Visibility for Dashboard
-- Ensure Admins can view ALL data in critical tables
-- 1. PROFILES
-- Drop existing admin policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- 2. USER_SUBSCRIPTIONS
-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- 3. TRANSACTIONS
-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- 4. INVOICES
-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices" ON invoices FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );