-- Migration to fix user roles for users that should be clients
-- Users reported as incorrect forwarders: youssoudiopsane38@gmail.com, papiskanfon@gmail.com
UPDATE profiles
SET role = 'client'
WHERE email IN (
        'youssoudiopsane38@gmail.com',
        'papiskanfon@gmail.com'
    );
-- Optional: Ensure their client_tier is set to default if null
UPDATE profiles
SET client_tier = 'bronze'
WHERE email IN (
        'youssoudiopsane38@gmail.com',
        'papiskanfon@gmail.com'
    )
    AND client_tier IS NULL;