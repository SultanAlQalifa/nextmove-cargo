-- Public Tracking Function
-- Securely exposes limited shipment data for public tracking page
CREATE OR REPLACE FUNCTION get_public_shipment_tracking(tracking_code_input text) RETURNS TABLE (
        id UUID,
        tracking_number VARCHAR,
        status text,
        -- Changed to text to avoid "type does not exist" errors
        origin_port VARCHAR,
        destination_port VARCHAR,
        origin_country VARCHAR,
        destination_country VARCHAR,
        departure_date DATE,
        arrival_estimated_date DATE,
        progress INTEGER,
        events JSON
    ) SECURITY DEFINER -- Runs with system privileges to bypass RLS
    AS $$ BEGIN RETURN QUERY
SELECT s.id,
    s.tracking_number,
    s.status::text,
    -- Cast enum to text
    s.origin_port,
    s.destination_port,
    s.origin_country,
    s.destination_country,
    s.departure_date,
    s.arrival_estimated_date,
    s.progress,
    COALESCE(
        (
            SELECT json_agg(
                    json_build_object(
                        'status',
                        se.status,
                        'location',
                        se.location,
                        'description',
                        se.description,
                        'timestamp',
                        se.timestamp
                    )
                    ORDER BY se.timestamp DESC
                )
            FROM shipment_events se
            WHERE se.shipment_id = s.id
        ),
        '[]'::json
    ) as events
FROM shipments s
WHERE s.tracking_number = tracking_code_input;
END;
$$ LANGUAGE plpgsql;
-- Grant access to public role
GRANT EXECUTE ON FUNCTION get_public_shipment_tracking(text) TO anon,
    authenticated,
    service_role;