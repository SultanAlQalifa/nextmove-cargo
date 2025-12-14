-- 1. Fix Infinite Recursion on RFQs
DROP POLICY IF EXISTS "Clients can view parent RFQs" ON public.rfq_requests;
-- 2. Fix Missing Column and Relationship (Consolidations <-> Shipments)
DO $$ BEGIN -- Add the column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'consolidation_id'
) THEN
ALTER TABLE public.shipments
ADD COLUMN consolidation_id UUID;
END IF;
-- Add the foreign key constraint if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'shipments_consolidation_id_fkey'
) THEN
ALTER TABLE public.shipments
ADD CONSTRAINT shipments_consolidation_id_fkey FOREIGN KEY (consolidation_id) REFERENCES public.consolidations(id) ON DELETE
SET NULL;
END IF;
-- Create index for performance if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_shipments_consolidation'
) THEN CREATE INDEX idx_shipments_consolidation ON public.shipments(consolidation_id);
END IF;
END $$;
-- 3. Reload schema cache to fix API errors
NOTIFY pgrst,
'reload schema';