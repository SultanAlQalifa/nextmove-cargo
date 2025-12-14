-- Add payment_method ENUM
CREATE TYPE payment_method AS ENUM ('online', 'on_delivery');
-- Add 'rejected' to rfq_status
ALTER TYPE rfq_status
ADD VALUE IF NOT EXISTS 'rejected';
-- Add columns to rfq_requests
ALTER TABLE rfq_requests
ADD COLUMN payment_method payment_method DEFAULT 'on_delivery',
    ADD COLUMN parent_rfq_id UUID REFERENCES rfq_requests(id) ON DELETE
SET NULL,
    ADD COLUMN is_retry BOOLEAN DEFAULT FALSE;
-- Add index for parent_rfq_id
CREATE INDEX idx_rfq_parent ON rfq_requests(parent_rfq_id);
-- Update RLS to allow reading parent RFQ
CREATE POLICY "Clients can view parent RFQs" ON rfq_requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM rfq_requests as child
            WHERE child.parent_rfq_id = rfq_requests.id
                AND child.client_id = auth.uid()
        )
    );
-- Comment
COMMENT ON COLUMN rfq_requests.payment_method IS 'Method of payment: online (auto-validation on retry) or on_delivery (standard)';
COMMENT ON COLUMN rfq_requests.parent_rfq_id IS 'ID of the original rejected RFQ if this is a retry';