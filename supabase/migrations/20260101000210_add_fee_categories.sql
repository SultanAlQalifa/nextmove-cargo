-- Migration: Add missing fee categories
-- Description: Adds 'packaging', 'priority', 'inspection', 'door_to_door' to fee_category enum.
DO $$ BEGIN ALTER TYPE fee_category
ADD VALUE IF NOT EXISTS 'packaging';
ALTER TYPE fee_category
ADD VALUE IF NOT EXISTS 'priority';
ALTER TYPE fee_category
ADD VALUE IF NOT EXISTS 'inspection';
ALTER TYPE fee_category
ADD VALUE IF NOT EXISTS 'door_to_door';
EXCEPTION
WHEN duplicate_object THEN null;
END $$;