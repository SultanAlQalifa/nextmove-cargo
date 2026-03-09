-- Confirm test users manually
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN (
        'nextemove.demo.client@gmail.com',
        'nextemove.demo.forwarder@gmail.com'
    );