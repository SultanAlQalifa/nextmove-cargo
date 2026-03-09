-- Fix Analytics RPCs
-- 1. Fix get_dashboard_stats with SECURITY DEFINER and robust checks
CREATE OR REPLACE FUNCTION get_dashboard_stats() RETURNS JSONB AS $$
DECLARE total_users INT;
total_shipments INT;
active_shipments INT;
total_revenue DECIMAL(10, 2);
revenue_growth DECIMAL(5, 2);
BEGIN -- Count Users
SELECT COUNT(*) INTO total_users
FROM profiles;
-- Count Shipments
SELECT COUNT(*) INTO total_shipments
FROM rfq_requests
WHERE status != 'draft';
-- Count Active Shipments
SELECT COUNT(*) INTO active_shipments
FROM rfq_requests
WHERE status IN (
        'published',
        'quoted',
        'booked',
        'in_transit',
        'customs'
    );
-- Calculate Revenue
-- Check if transactions table exists to avoid errors if not yet created
IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'transactions'
) THEN EXECUTE 'SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = ''completed''' INTO total_revenue;
ELSE total_revenue := 0;
END IF;
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
    12.5 -- Mock growth
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Runs with creator privileges (admin)
-- 2. Fix get_revenue_chart with SECURITY DEFINER and correct GROUP BY
CREATE OR REPLACE FUNCTION get_revenue_chart(time_range TEXT DEFAULT 'year') RETURNS TABLE (date TEXT, amount DECIMAL(10, 2)) AS $$ BEGIN IF NOT EXISTS (
        SELECT
        FROM information_schema.tables
        WHERE table_name = 'transactions'
    ) THEN RETURN QUERY
SELECT to_char(NOW(), 'Mon'),
    0.00;
RETURN;
END IF;
RETURN QUERY EXECUTE '
        SELECT 
            to_char(created_at, ''Mon'') as date,
            SUM(amount) as amount
        FROM transactions
        WHERE status = ''completed''
            AND created_at > (NOW() - INTERVAL ''1 year'')
        GROUP BY date_trunc(''month'', created_at), to_char(created_at, ''Mon'')
        ORDER BY date_trunc(''month'', created_at)';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;