-- ═══════════════════════════════════════════════════════════════
-- Allow Public Access to Rates (Calculator)
-- The calculator is a public tool, so rates must be readable by anon users.
-- ═══════════════════════════════════════════════════════════════
-- 1. Forwarder Rates
DROP POLICY IF EXISTS "Authenticated users can read" ON forwarder_rates;
DROP POLICY IF EXISTS "Public can view forwarder rates" ON forwarder_rates;
CREATE POLICY "Public can view forwarder rates" ON forwarder_rates FOR
SELECT TO public USING (true);
-- 2. Platform Rates
DROP POLICY IF EXISTS "Public read access to platform rates" ON platform_rates;
CREATE POLICY "Public read access to platform rates" ON platform_rates FOR
SELECT TO public USING (true);
-- 3. Locations (Should already be public, but ensuring it)
DROP POLICY IF EXISTS "Public read access to locations" ON locations;
CREATE POLICY "Public read access to locations" ON locations FOR
SELECT TO public USING (status = 'active');