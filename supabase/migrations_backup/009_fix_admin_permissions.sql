-- ═══════════════════════════════════════════════════════════════
-- Fix Admin Permissions & RLS
-- ═══════════════════════════════════════════════════════════════
-- 1. Explicitly set the owner/admin user to 'super-admin'
-- This bypasses the RLS that prevents users from upgrading themselves
UPDATE profiles
SET role = 'super-admin'
WHERE email = 'wandifaproperties@gmail.com'
    OR full_name ILIKE '%CHEIKH%'
    OR full_name ILIKE '%DJEYLANI%';
-- 2. Add a failsafe policy for the owner email on subscription_plans
-- This ensures that even if the role update fails or is reverted, the owner can still manage plans
DROP POLICY IF EXISTS "Owner can always manage plans" ON subscription_plans;
CREATE POLICY "Owner can always manage plans" ON subscription_plans FOR ALL USING (
    auth.jwt()->>'email' = 'wandifaproperties@gmail.com'
);
-- 3. Also add failsafe for profiles to ensure they can manage users
DROP POLICY IF EXISTS "Owner can always manage profiles" ON profiles;
CREATE POLICY "Owner can always manage profiles" ON profiles FOR ALL USING (
    auth.jwt()->>'email' = 'wandifaproperties@gmail.com'
);