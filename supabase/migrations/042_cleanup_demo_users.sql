-- ═══════════════════════════════════════════════════════════════
-- Cleanup Production Data
-- Remove Demo Accounts created during testing
-- ═══════════════════════════════════════════════════════════════
-- Delete users from auth.users (Cascades to public.profiles)
DELETE FROM auth.users
WHERE email IN (
        'nextemove.demo.client@gmail.com',
        'nextemove.demo.forwarder@gmail.com',
        'nextemove.demo.driver@gmail.com',
        'admin@example.com',
        'user@example.com'
    );
-- Delete any profiles that might have been orphaned (unlikely but safe)
DELETE FROM public.profiles
WHERE email IN (
        'nextemove.demo.client@gmail.com',
        'nextemove.demo.forwarder@gmail.com',
        'nextemove.demo.driver@gmail.com',
        'admin@example.com',
        'user@example.com'
    );