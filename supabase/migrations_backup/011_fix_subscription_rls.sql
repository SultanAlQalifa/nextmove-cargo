-- Fix RLS for user_subscriptions to allow users to subscribe
-- Current policies only allow SELECT for users and ALL for admins.
-- We need to allow users to INSERT their own subscription records.
-- Drop existing policy if it exists (to be safe, though it likely doesn't)
DROP POLICY IF EXISTS "Users can create own subscription" ON user_subscriptions;
-- Create new policy allowing INSERT
CREATE POLICY "Users can create own subscription" ON user_subscriptions FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Also ensure they can update their own subscription (e.g. cancel)
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR
UPDATE USING (auth.uid() = user_id);