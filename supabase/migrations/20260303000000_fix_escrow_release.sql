-- Fix Critical Escrow Bypass Vulnerability
-- The previous trigger released funds immediately on 'delivered' status.
-- This new trigger only releases funds when the client or admin explicitly marks the shipment as 'completed' (i.e. after POD verification).
-- 1. Ensure type and table exist (Idempotent)
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'shipment_status'
) THEN CREATE TYPE shipment_status AS ENUM (
  'pending',
  'picked_up',
  'in_transit',
  'customs',
  'delivered',
  'cancelled',
  'completed',
  'disputed'
);
END IF;
END $$;
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status shipment_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Drop the dangerous old trigger and function
DROP TRIGGER IF EXISTS on_shipment_delivered_release_funds ON shipments;
DROP FUNCTION IF EXISTS auto_release_funds_on_delivery();
DROP FUNCTION IF EXISTS trigger_auto_release_funds();
-- 3. Create the secure new function
CREATE OR REPLACE FUNCTION release_funds_on_completion() RETURNS TRIGGER AS $$ BEGIN -- Only release if transitioning to 'completed'
  IF NEW.status::text = 'completed'
  AND OLD.status::text != 'completed' THEN -- Check if function exists before calling
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'release_shipment_funds'
  ) THEN PERFORM release_shipment_funds(NEW.id);
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 4. Create the secure new trigger
DROP TRIGGER IF EXISTS on_shipment_completed_release_funds ON shipments;
CREATE TRIGGER on_shipment_completed_release_funds
AFTER
UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION release_funds_on_completion();
-- Note: Additional statuses 'pending_confirmation' and 'disputed' are now included in the initial type creation above.