CREATE OR REPLACE FUNCTION trigger_auto_release_funds() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    PERFORM release_shipment_funds(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_shipment_delivered_release_funds ON shipments;
CREATE TRIGGER on_shipment_delivered_release_funds
AFTER UPDATE ON shipments FOR EACH ROW 
EXECUTE FUNCTION trigger_auto_release_funds();
