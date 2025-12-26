-- Fix missing columns and robustness in Tracking
-- 1. Ensure progress column exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'progress'
) THEN
ALTER TABLE public.shipments
ADD COLUMN progress INTEGER DEFAULT 0 CHECK (
        progress >= 0
        AND progress <= 100
    );
END IF;
END $$;
-- 2. Ensure arrival_estimated_date exists (double safety)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'arrival_estimated_date'
) THEN
ALTER TABLE public.shipments
ADD COLUMN arrival_estimated_date DATE;
END IF;
END $$;
-- 3. Update the tracking function to be more resilient
CREATE OR REPLACE FUNCTION get_public_shipment_tracking(tracking_code_input text) RETURNS TABLE (
        id UUID,
        tracking_number VARCHAR,
        status text,
        origin_port VARCHAR,
        destination_port VARCHAR,
        origin_country VARCHAR,
        destination_country VARCHAR,
        departure_date DATE,
        arrival_estimated_date DATE,
        progress INTEGER,
        events JSON
    ) SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT s.id,
    s.tracking_number,
    s.status::text,
    s.origin_port,
    s.destination_port,
    s.origin_country,
    s.destination_country,
    s.departure_date,
    s.arrival_estimated_date,
    COALESCE(s.progress, 0),
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
FROM shipments s -- We trim spaces for more robustness
WHERE TRIM(s.tracking_number) = TRIM(tracking_code_input)
    OR s.tracking_number = REPLACE(tracking_code_input, ' ', '');
END;
$$ LANGUAGE plpgsql;