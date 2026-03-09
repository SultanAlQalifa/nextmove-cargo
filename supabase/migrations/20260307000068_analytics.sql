-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Analytics System
-- Phase 2: Admin Dashboard Real Data
-- ═══════════════════════════════════════════════════════════════
-- 1. Get Global Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats() RETURNS JSONB AS $$
DECLARE total_users INT;
total_shipments INT;
active_shipments INT;
total_revenue DECIMAL(10, 2);
revenue_growth DECIMAL(5, 2);
-- Mock growth for now, or calc vs last month
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
-- Calculate Revenue (Sum of paid transactions)
-- Assuming 'transactions' table exists or we sum from 'payments'
-- If no payments table yet, we sum accepted offers as "projected revenue"
-- For now, let's assume we sum 'amount' from 'transactions' where status = 'completed'
-- If transactions table doesn't exist, we return 0.
-- Check if transactions table exists
IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'transactions'
) THEN
SELECT COALESCE(SUM(amount), 0) INTO total_revenue
FROM transactions
WHERE status = 'completed';
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
    12.5 -- Hardcoded for demo until we have historical data
);
END;
$$ LANGUAGE plpgsql;
-- 2. Get Revenue Chart Data
CREATE OR REPLACE FUNCTION get_revenue_chart(time_range TEXT DEFAULT 'year') RETURNS TABLE (date TEXT, amount DECIMAL(10, 2)) AS $$ BEGIN -- If no transactions table, return empty
    IF NOT EXISTS (
        SELECT
        FROM information_schema.tables
        WHERE table_name = 'transactions'
    ) THEN RETURN QUERY
SELECT to_char(NOW(), 'Mon'),
    0.00;
RETURN;
END IF;
RETURN QUERY
SELECT to_char(created_at, 'Mon') as date,
    SUM(amount) as amount
FROM transactions
WHERE status = 'completed'
    AND created_at > (NOW() - INTERVAL '1 year')
GROUP BY 1,
    date_trunc('month', created_at)
ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql;
-- 3. Get Shipment Status Distribution
CREATE OR REPLACE FUNCTION get_shipment_stats() RETURNS TABLE (status TEXT, count BIGINT) AS $$ BEGIN RETURN QUERY
SELECT r.status::TEXT,
    COUNT(*)
FROM rfq_requests r
GROUP BY r.status;
END;
$$ LANGUAGE plpgsql;