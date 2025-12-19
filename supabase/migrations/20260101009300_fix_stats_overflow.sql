-- Fix numeric field overflow in get_dashboard_stats
-- The previous DECIMAL(5, 2) was too small for high growth rates (max 999.99%)
CREATE OR REPLACE FUNCTION get_dashboard_stats() RETURNS jsonb SECURITY DEFINER
SET search_path = public AS $$
DECLARE -- Current Counts
    total_users int;
total_shipments int;
active_shipments int;
total_revenue decimal(15, 2);
-- Previous Period Counts (for growth calculation)
prev_users int;
prev_shipments int;
prev_revenue decimal(15, 2);
-- Growth Rates
user_growth decimal(10, 2);
shipment_growth decimal(10, 2);
revenue_growth decimal(10, 2);
-- Conversion
total_rfqs int;
accepted_offers int;
conversion_rate decimal(10, 2);
BEGIN -- 1. USERS
SELECT COUNT(*) INTO total_users
FROM profiles;
SELECT COUNT(*) INTO prev_users
FROM profiles
WHERE created_at < date_trunc('month', CURRENT_DATE);
IF prev_users > 0 THEN user_growth := ((total_users - prev_users)::decimal / prev_users) * 100;
ELSE user_growth := 0;
END IF;
-- 2. SHIPMENTS (RFQs)
SELECT COUNT(*) INTO total_shipments
FROM rfq_requests
WHERE status != 'draft';
SELECT COUNT(*) INTO prev_shipments
FROM rfq_requests
WHERE status != 'draft'
    AND created_at < date_trunc('month', CURRENT_DATE);
IF prev_shipments > 0 THEN shipment_growth := (
    (total_shipments - prev_shipments)::decimal / prev_shipments
) * 100;
ELSE shipment_growth := 0;
END IF;
-- Active Shipments
SELECT COUNT(*) INTO active_shipments
FROM rfq_requests
WHERE status IN ('published', 'offers_received', 'offer_accepted');
-- 3. REVENUE
IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'transactions'
) THEN
SELECT COALESCE(SUM(amount), 0) INTO total_revenue
FROM transactions
WHERE status = 'completed';
SELECT COALESCE(SUM(amount), 0) INTO prev_revenue
FROM transactions
WHERE status = 'completed'
    AND created_at < date_trunc('month', CURRENT_DATE);
IF prev_revenue > 0 THEN revenue_growth := ((total_revenue - prev_revenue) / prev_revenue) * 100;
ELSE revenue_growth := 0;
END IF;
ELSE total_revenue := 0;
revenue_growth := 0;
END IF;
-- 4. CONVERSION RATE
SELECT COUNT(*) INTO total_rfqs
FROM rfq_requests;
SELECT COUNT(*) INTO accepted_offers
FROM rfq_requests
WHERE status = 'offer_accepted';
IF total_rfqs > 0 THEN conversion_rate := (accepted_offers::decimal / total_rfqs) * 100;
ELSE conversion_rate := 0;
END IF;
RETURN jsonb_build_object(
    'total_users',
    total_users,
    'user_growth',
    COALESCE(user_growth, 0),
    'total_shipments',
    total_shipments,
    'shipment_growth',
    COALESCE(shipment_growth, 0),
    'active_shipments',
    active_shipments,
    'total_revenue',
    total_revenue,
    'revenue_growth',
    COALESCE(revenue_growth, 0),
    'conversion_rate',
    COALESCE(conversion_rate, 0)
);
END;
$$ LANGUAGE plpgsql;