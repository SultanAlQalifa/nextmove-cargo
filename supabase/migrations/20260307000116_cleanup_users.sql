-- Cleanup failed test users and their data
DELETE FROM public.quote_requests
WHERE client_id IN (
        SELECT id
        FROM public.profiles
        WHERE email IN ('client@test.com', 'forwarder@test.com')
    );
DELETE FROM public.rates
WHERE forwarder_id IN (
        SELECT id
        FROM public.profiles
        WHERE email IN ('client@test.com', 'forwarder@test.com')
    );
DELETE FROM auth.users
WHERE email IN ('client@test.com', 'forwarder@test.com');
DELETE FROM public.profiles
WHERE email IN ('client@test.com', 'forwarder@test.com');