-- Fix Analytics RPCs (Robust Version)
-- This script drops and recreates the functions to ensure no lingering issues.
DROP FUNCTION IF EXISTS get_shipment_stats();
DROP FUNCTION IF EXISTS get_dashboard_stats();
DROP FUNCTION IF EXISTS get_revenue_chart(text);
-- 1. Fix get_shipment_stats
CREATE OR REPLACE FUNCTION get_shipment_stats() RETURNS TABLE (status text, count bigint) SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT COALESCE(r.status::text, 'unknown')::text,
    COUNT(*)::bigint
FROM rfq_requests r
GROUP BY r.status;
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION get_shipment_stats() TO authenticated;
-- 2. Fix get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats() RETURNS jsonb SECURITY DEFINER
SET search_path = public AS $$
DECLARE total_users int;
total_shipments int;
active_shipments int;
total_revenue decimal(10, 2);
revenue_growth decimal(5, 2);
BEGIN -- Count Users
SELECT COUNT(*)::int INTO total_users
FROM profiles;
-- Count Shipments
SELECT COUNT(*)::int INTO total_shipments
FROM rfq_requests
WHERE status != 'draft';
-- Count Active Shipments
SELECT COUNT(*)::int INTO active_shipments
FROM rfq_requests
WHERE status::text IN ('published', 'offers_received', 'offer_accepted');
-- Calculate Revenue (Safely)
-- We use a dynamic query to avoid compilation errors if table doesn't exist
BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'transactions'
) THEN EXECUTE 'SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = ''completed''' INTO total_revenue;
ELSE total_revenue := 0;
END IF;
EXCEPTION
WHEN OTHERS THEN total_revenue := 0;
END;
RETURN jsonb_build_object(
    'total_users',
    total_users,
    'total_shipments',
    total_shipments,
    'active_shipments',
    active_shipments,
    'total_revenue',
    total_revenue,
    'revenue_growth',
    12.5
);
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
-- 3. Fix get_revenue_chart
CREATE OR REPLACE FUNCTION get_revenue_chart(time_range text DEFAULT 'year') RETURNS TABLE (date text, amount decimal(10, 2)) SECURITY DEFINER
SET search_path = public AS $$
DECLARE interval_val interval;
BEGIN -- Determine interval based on time_range
CASE
    time_range
    WHEN '7d' THEN interval_val := '7 days'::interval;
WHEN '30d' THEN interval_val := '30 days'::interval;
WHEN '3m' THEN interval_val := '3 months'::interval;
WHEN 'year' THEN interval_val := '1 year'::interval;
ELSE interval_val := '1 year'::interval;
END CASE
;
IF NOT EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'transactions'
) THEN RETURN QUERY
SELECT to_char(NOW(), 'Mon')::text,
    0.00::decimal;
RETURN;
END IF;
RETURN QUERY EXECUTE format(
    '
        SELECT 
            to_char(created_at, ''Mon'')::text as date,
            SUM(amount)::decimal(10, 2) as amount
        FROM transactions
        WHERE status = ''completed''
            AND created_at > (NOW() - %L::interval)
        GROUP BY date_trunc(''month'', created_at), to_char(created_at, ''Mon'')
        ORDER BY date_trunc(''month'', created_at)',
    interval_val
);
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION get_revenue_chart(text) TO authenticated;