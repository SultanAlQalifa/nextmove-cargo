-- Add payment_method ENUM
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('online', 'on_delivery');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- Add 'rejected' to rfq_status
ALTER TYPE rfq_status
ADD VALUE IF NOT EXISTS 'rejected';
-- Add columns to rfq_requests
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfq_requests'
        AND column_name = 'payment_method'
) THEN
ALTER TABLE rfq_requests
ADD COLUMN payment_method payment_method DEFAULT 'on_delivery';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfq_requests'
        AND column_name = 'parent_rfq_id'
) THEN
ALTER TABLE rfq_requests
ADD COLUMN parent_rfq_id UUID REFERENCES rfq_requests(id) ON DELETE
SET NULL;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfq_requests'
        AND column_name = 'is_retry'
) THEN
ALTER TABLE rfq_requests
ADD COLUMN is_retry BOOLEAN DEFAULT FALSE;
END IF;
END $$;
-- Add index for parent_rfq_id
CREATE INDEX IF NOT EXISTS idx_rfq_parent ON rfq_requests(parent_rfq_id);
-- Update RLS to allow reading parent RFQ
DROP POLICY IF EXISTS "Clients can view parent RFQs" ON rfq_requests;
CREATE POLICY "Clients can view parent RFQs" ON rfq_requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM rfq_requests as child
            WHERE child.parent_rfq_id = rfq_requests.id
                AND child.client_id = (
                    select auth.uid()
                )
        )
    );
-- Comment
COMMENT ON COLUMN rfq_requests.payment_method IS 'Method of payment: online (auto-validation on retry) or on_delivery (standard)';
COMMENT ON COLUMN rfq_requests.parent_rfq_id IS 'ID of the original rejected RFQ if this is a retry';