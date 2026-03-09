-- Fix get_shipment_stats RPC
-- This function was causing 500 errors, likely due to permission issues or missing SECURITY DEFINER.
CREATE OR REPLACE FUNCTION get_shipment_stats() RETURNS TABLE (status TEXT, count BIGINT) SECURITY DEFINER -- Run as creator (admin) to bypass RLS if needed, or just to ensure consistency
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT COALESCE(r.status, 'unknown')::TEXT,
    COUNT(*)
FROM rfq_requests r
GROUP BY r.status;
END;
$$ LANGUAGE plpgsql;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_shipment_stats() TO authenticated;