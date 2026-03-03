-- Fix Critical Escrow Bypass Vulnerability
-- The previous trigger released funds immediately on 'delivered' status.
-- This new trigger only releases funds when the client or admin explicitly marks the shipment as 'completed' (i.e. after POD verification).

-- 1. Drop the dangerous old trigger and function
DROP TRIGGER IF EXISTS on_shipment_delivered_release_funds ON shipments;
DROP FUNCTION IF EXISTS auto_release_funds_on_delivery();
DROP FUNCTION IF EXISTS trigger_auto_release_funds();

-- 2. Create the secure new function
CREATE OR REPLACE FUNCTION release_funds_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only release if transitioning to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM release_shipment_funds(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create the secure new trigger
CREATE TRIGGER on_shipment_completed_release_funds
AFTER UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION release_funds_on_completion();

-- Allow pending_confirmation status
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'pending_confirmation';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'disputed';
