-- Fix User Data
-- 1. Promote 'afriflux' to forwarder
UPDATE profiles
SET role = 'forwarder',
    subscription_status = 'active',
    -- Give them active sub so they show up
    kyc_status = 'verified' -- Verify them so they can operate
WHERE email = 'afriflux@gmail.com';
-- 2. Delete 'Test Client'
DELETE FROM profiles
WHERE email = 'nextemove.demo.client@gmail.com';