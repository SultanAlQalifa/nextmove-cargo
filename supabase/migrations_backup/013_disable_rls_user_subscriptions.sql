-- DEBUG: Temporarily disable RLS on user_subscriptions to unblock insertion
-- If this fixes the error, we know for sure it's a policy issue.
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;