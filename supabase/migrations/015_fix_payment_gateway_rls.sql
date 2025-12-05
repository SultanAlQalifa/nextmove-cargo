-- Fix Payment Gateway RLS
-- The previous policy relied on a recursive check on profiles which might fail or be blocked.
-- We add a direct policy for the owner/admin email to ensure they can always manage gateways.
DROP POLICY IF EXISTS "Owner can always manage gateways" ON payment_gateways;
CREATE POLICY "Owner can always manage gateways" ON payment_gateways FOR ALL USING (
    auth.jwt()->>'email' = 'wandifaproperties@gmail.com'
);
-- Also ensure the generic admin policy is robust
DROP POLICY IF EXISTS "Admins can manage gateways" ON payment_gateways;
CREATE POLICY "Admins can manage gateways" ON payment_gateways FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);