-- Add services_requested column to consolidations table
ALTER TABLE consolidations
ADD COLUMN services_requested TEXT [] DEFAULT '{}';
-- Add comment for documentation
COMMENT ON COLUMN consolidations.services_requested IS 'List of additional services requested (e.g., insurance, customs_clearance)';