-- Add services_requested column to consolidations table
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'consolidations'
        AND column_name = 'services_requested'
) THEN
ALTER TABLE consolidations
ADD COLUMN services_requested TEXT [] DEFAULT '{}';
END IF;
END $$;
-- Add comment for documentation
COMMENT ON COLUMN consolidations.services_requested IS 'List of additional services requested (e.g., insurance, customs_clearance)';