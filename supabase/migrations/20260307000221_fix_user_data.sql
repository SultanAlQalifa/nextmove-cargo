-- Fix User Data
DO $$ BEGIN -- Bypass the role change trigger for migration
PERFORM set_config('app.bypass_role_check', 'on', true);
-- 1. Promote 'afriflux' to forwarder
UPDATE profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    -- Give them active sub so they show up
    kyc_status = 'verified' -- Verify them so they can operate
WHERE email = 'afriflux@gmail.com';
-- 2. Delete 'Test Client'
DELETE FROM profiles
WHERE email = 'nextemove.demo.client@gmail.com';
-- Reset bypass
PERFORM set_config('app.bypass_role_check', 'off', true);
END $$;