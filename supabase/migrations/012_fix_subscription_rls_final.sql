-- Comprehensive RLS fix for user_subscriptions
-- This migration drops ALL existing policies on user_subscriptions and recreates them to ensure no conflicts.
-- 1. Enable RLS (just in case)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
-- 3. Recreate Policies
-- Allow users to VIEW their own subscription
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR
SELECT USING (auth.uid() = user_id);
-- Allow users to INSERT their own subscription
CREATE POLICY "Users can create own subscription" ON user_subscriptions FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to UPDATE their own subscription (e.g. for cancellation)
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR
UPDATE USING (auth.uid() = user_id);
-- Allow Admins to do EVERYTHING
CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- 4. Grant permissions to authenticated users
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON user_subscriptions TO service_role;