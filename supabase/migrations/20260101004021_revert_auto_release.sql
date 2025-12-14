-- Revert Auto-Release Trigger
DROP TRIGGER IF EXISTS on_shipment_delivered_release_funds ON shipments;
DROP FUNCTION IF EXISTS trigger_auto_release_funds();