-- Fix for missing column error: "Could not find the 'arrival_estimated_date' column"
-- This ensures the column exists even if previous migrations failed specifically on this.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'arrival_estimated_date'
) THEN
ALTER TABLE public.shipments
ADD COLUMN arrival_estimated_date DATE;
END IF;
END $$;
-- Force schema cache reload (usually automatic, but specific comment for user)
COMMENT ON COLUMN public.shipments.arrival_estimated_date IS 'Expected arrival date for the shipment';