-- Trigger to automatically release funds when shipment is delivered
CREATE OR REPLACE FUNCTION trigger_auto_release_funds() RETURNS TRIGGER AS $$
DECLARE result JSONB;
BEGIN -- Only trigger if status changed to 'delivered'
IF NEW.status = 'delivered'
AND OLD.status != 'delivered' THEN -- Call the release funds function
-- We perform this using the RPC call. Note: Triggers on tables run with the privileges of the owner/definer in some contexts,
-- but calling a security definer function works fine.
-- Logging for debug
RAISE NOTICE 'Auto-releasing funds for shipment %',
NEW.id;
-- Call the release logic
-- We don't capture the result in a way that stops the update if funds fail (maybe we should? No, delivery is physical fact)
-- Ideally this should be robust.
-- Note: We directly call the function.
-- We wrapped it in a block to catch errors if necessary, but failing here might block the update which is debatable.
-- For now, we allow it. If financial logic fails, we want to know.
PERFORM release_shipment_funds(NEW.id);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Check if trigger exists and drop (for idempotency in scripts)
DROP TRIGGER IF EXISTS on_shipment_delivered_release_funds ON shipments;
-- Create Trigger
CREATE TRIGGER on_shipment_delivered_release_funds
AFTER
UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION trigger_auto_release_funds();