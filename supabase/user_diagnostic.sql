-- ====================================================================
-- USER-SPECIFIC DIAGNOSTIC (Google-Test vs Afriflux) - FIXED
-- ====================================================================
-- 1. Compare Metadata & Raw Data
SELECT email,
    id,
    role as auth_role,
    raw_user_meta_data,
    raw_app_meta_data,
    last_sign_in_at
FROM auth.users
WHERE email IN (
        'test-google@nextmove-cargo.com',
        'afriflux@gmail.com'
    );
-- 2. Check for any active triggers on auth.users (Fixed join)
-- This checks if a hidden trigger is crashing for certain emails
SELECT tgname as trigger_name,
    tgfoid::regproc as function_name,
    tgenabled as status
FROM pg_trigger
    JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_class.relname = 'users'
    AND pg_namespace.nspname = 'auth';
-- 3. Check for any Profile inconsistencies
SELECT email,
    role,
    friendly_id,
    account_status
FROM public.profiles
WHERE email IN (
        'test-google@nextmove-cargo.com',
        'afriflux@gmail.com'
    );