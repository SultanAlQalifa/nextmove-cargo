-- Fix Super Admin & Admin Status
-- Ensures that any user with role 'admin' or 'super-admin' is automatically active and verified
UPDATE public.profiles
SET account_status = 'active',
    kyc_status = 'verified',
    verification_status = 'verified'
WHERE role IN ('admin', 'super-admin');
-- Double check role assignment
UPDATE public.profiles
SET role = 'super-admin',
    account_status = 'active',
    kyc_status = 'verified',
    verification_status = 'verified'
WHERE email = 'admin@nextmove-cargo.com'
    OR email = 'admin@example.com';
UPDATE public.profiles
SET account_status = 'active'
WHERE email = 'wandifaproperties@gmail.com'
    AND role = 'super-admin';