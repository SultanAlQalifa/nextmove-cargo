-- ====================================================================
-- METADATA REPAIR: Restoring Standard Fields for test-google
-- ====================================================================
UPDATE auth.users
SET -- Restore expected fields in User Metadata
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'email',
        email,
        'email_verified',
        true,
        -- Force verification for testing
        'sub',
        id::text -- Standard JWT 'sub' claim
    ),
    -- Restore expected structure in App Metadata
    raw_app_meta_data = raw_app_meta_data || '{"providers": ["email"]}'::jsonb
WHERE email = 'test-google@nextmove-cargo.com';
-- Verification
SELECT email,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users
WHERE email = 'test-google@nextmove-cargo.com';