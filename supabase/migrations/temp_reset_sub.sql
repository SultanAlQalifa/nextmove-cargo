-- Reset subscription for user djeylanidjitte@gmail.com
UPDATE user_subscriptions
SET status = 'cancelled'
WHERE user_id IN (
        SELECT id
        FROM profiles
        WHERE email = 'djeylanidjitte@gmail.com'
    );
-- Reset role to client
UPDATE profiles
SET role = 'client',
    subscription_plan = NULL
WHERE email = 'djeylanidjitte@gmail.com';