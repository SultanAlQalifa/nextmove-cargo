-- Fix RFQ Permissions
-- Ensure clients can properly create and view their RFQs
-- Sometimes policies get overwritten or are too strict
BEGIN;
-- 1. Ensure RLS is enabled
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Clients can create RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Clients can view own RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Clients can update own draft RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Clients can delete own draft RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Admins can view all RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Admins can update all RFQs" ON rfq_requests;
DROP POLICY IF EXISTS "Forwarders can view published RFQs" ON rfq_requests;
-- 3. Re-create Policies
-- A. INSERT: Clients can create RFQs where they are the client
CREATE POLICY "Clients can create RFQs" ON rfq_requests FOR
INSERT WITH CHECK (auth.uid() = client_id);
-- B. SELECT: Clients can view their own RFQs
CREATE POLICY "Clients can view own RFQs" ON rfq_requests FOR
SELECT USING (auth.uid() = client_id);
-- C. UPDATE: Clients can update their own DRAFT RFQs
CREATE POLICY "Clients can update own draft RFQs" ON rfq_requests FOR
UPDATE USING (
        auth.uid() = client_id
        AND status = 'draft'
    ) WITH CHECK (auth.uid() = client_id);
-- D. DELETE: Clients can delete their own DRAFT RFQs
CREATE POLICY "Clients can delete own draft RFQs" ON rfq_requests FOR DELETE USING (
    auth.uid() = client_id
    AND status = 'draft'
);
-- E. ADMINS: Full access
CREATE POLICY "Admins can view all RFQs" ON rfq_requests FOR
SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all RFQs" ON rfq_requests FOR
UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all RFQs" ON rfq_requests FOR DELETE USING (public.is_admin());
-- F. FORWARDERS: Can view published/active RFQs
-- Only if not specific, OR specific to them
CREATE POLICY "Forwarders can view published RFQs" ON rfq_requests FOR
SELECT USING (
        status IN ('published', 'offers_received', 'offer_accepted')
        AND (
            specific_forwarder_id IS NULL
            OR specific_forwarder_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'forwarder'
        )
    );
COMMIT;