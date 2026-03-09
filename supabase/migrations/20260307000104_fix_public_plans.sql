-- ═══════════════════════════════════════════════════════════════
-- Fix Public Access to Subscription Plans
-- ═══════════════════════════════════════════════════════════════
-- Ensure the table has RLS enabled
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
-- Re-create the public read policy to ensure it exists
DROP POLICY IF EXISTS "Public read access to plans" ON subscription_plans;
CREATE POLICY "Public read access to plans" ON subscription_plans FOR
SELECT USING (true);
-- Grant SELECT permission to authenticated and anon roles just in case
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;