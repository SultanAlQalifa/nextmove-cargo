-- RESTORE FORWARDER ROLE
-- Issue: The "Ultimate Fix" likely promoted your forwarder account to 'super-admin'.
-- Result: The calculator can't find it because it looks for role='forwarder'.
-- INSTRUCTIONS:
-- 1. Replace 'votre_email_transitaire@exemple.com' with the REAL email of your forwarder account.
-- 2. Run this script in the Supabase SQL Editor.
UPDATE profiles
SET role = 'forwarder',
    account_status = 'active',
    verification_status = 'verified',
    company_name = COALESCE(company_name, 'Mon Entreprise de Transport') -- Ensure a name exists
WHERE email = 'votre_email_transitaire@exemple.com';
-- <--- REPLACE THIS EMAIL
-- Verification (Check if it worked)
SELECT email,
    role,
    company_name,
    account_status
FROM profiles
WHERE email = 'votre_email_transitaire@exemple.com';