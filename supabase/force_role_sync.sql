-- ====================================================================
-- FORCE ROLE SYNC (Manual Trigger Replacement)
-- ====================================================================
-- 1. Correct Public Profile (Just in case)
UPDATE public.profiles
SET role = 'forwarder'
WHERE email = 'test-google@nextmove-cargo.com';
-- 2. Force Update Auth Metadata (Since triggers are off)
-- This ensures the JWT and Auth API see the correct role
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "forwarder"}'::jsonb
WHERE email = 'test-google@nextmove-cargo.com';
-- 3. Verify
SELECT p.email,
    p.role as public_role,
    u.raw_user_meta_data->>'role' as auth_meta_role
FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
WHERE p.email = 'test-google@nextmove-cargo.com';