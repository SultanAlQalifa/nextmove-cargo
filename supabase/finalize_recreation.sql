-- ====================================================================
-- FINAL SETUP (Corrected): Confirming & Setting Password
-- ====================================================================
-- 1. Manually confirm the email and set a known password
-- Removed 'confirmed_at' as it is a generated column in newer Supabase
UPDATE auth.users
SET email_confirmed_at = NOW(),
    last_sign_in_at = NULL,
    encrypted_password = crypt('GoogleNextMove2026', gen_salt('bf')),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb,
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
WHERE email = 'test-google@nextmove-cargo.com';
-- 2. Ensure the Profile exists and is set to 'forwarder'
-- This will trigger the Friendly ID generation (P0xxx)
UPDATE public.profiles
SET role = 'forwarder',
    account_status = 'active'
WHERE email = 'test-google@nextmove-cargo.com';
-- 3. FINAL VERIFICATION
SELECT email,
    email_confirmed_at,
    (
        SELECT role
        FROM public.profiles
        WHERE email = auth.users.email
    ) as profil,
    (
        SELECT friendly_id
        FROM public.profiles
        WHERE email = auth.users.email
    ) as identifiant
FROM auth.users
WHERE email = 'test-google@nextmove-cargo.com';