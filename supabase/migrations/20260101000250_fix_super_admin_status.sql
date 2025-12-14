-- Fix Super Admin & Admin Status
-- Ensures that any user with role 'admin' or 'super_admin' is automatically active and verified
UPDATE public.profiles
SET account_status = 'active',
    kyc_status = 'verified',
    verification_status = 'verified'
WHERE role IN ('admin', 'super_admin');
-- Also specifically target the likely super admin email if role isn't set correcty yet
UPDATE public.profiles
SET role = 'super_admin',
    account_status = 'active',
    kyc_status = 'verified',
    verification_status = 'verified'
WHERE email = 'admin@nextmove-cargo.com'
    OR email = 'admin@example.com';