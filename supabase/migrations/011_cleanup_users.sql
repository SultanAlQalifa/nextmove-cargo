-- Cleanup failed test users
DELETE FROM auth.users
WHERE email IN ('client@test.com', 'forwarder@test.com');
DELETE FROM public.profiles
WHERE email IN ('client@test.com', 'forwarder@test.com');