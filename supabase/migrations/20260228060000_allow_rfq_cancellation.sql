-- Fix: Enable clients to cancel their RFQs
-- Date: 2026-02-28
-- Current policy only allows updating if status = 'draft'
-- We add a specific policy to allow updating to 'cancelled'
CREATE POLICY "Clients can cancel own RFQs" ON rfq_requests FOR
UPDATE USING (auth.uid() = client_id) WITH CHECK (
        auth.uid() = client_id
        AND status = 'cancelled'
    );