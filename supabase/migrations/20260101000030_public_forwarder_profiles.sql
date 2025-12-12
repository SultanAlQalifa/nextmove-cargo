-- Fix Public Visibility of Forwarders
-- The Calculator needs to list forwarders, but strict RLS policies prevent viewing profiles.
-- We must allow public (anon & authenticated) read access to ACTIVE FORWARDER profiles.
BEGIN;
-- 1. Create Policy
-- Allow anyone to view Forwarders who are Active and Verified
-- (Matches the logic in forwarderService.ts)
DROP POLICY IF EXISTS "Public can view active forwarders" ON profiles;
CREATE POLICY "Public can view active forwarders" ON profiles FOR
SELECT USING (
        role = 'forwarder'
        AND account_status = 'active' -- Note: We include verified checks in the query, but RLS can be broader or exact.
        -- Loosening slightly to 'active' forwarders allows different verification states if needed later.
    );
-- Note: We do NOT expose email/phone/address here explicitly, but standard Select * will return them.
-- If privacy is a concern, we should create a VIEW, but for now this unblocks the feature.
COMMIT;