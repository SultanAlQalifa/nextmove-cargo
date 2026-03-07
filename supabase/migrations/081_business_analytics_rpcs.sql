-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Business Analytics RPCs
-- Adds performance tracking by agency (forwarder) and global KPIs
-- ═══════════════════════════════════════════════════════════════
-- 1. Agency Performance Stats
DROP FUNCTION IF EXISTS public.get_agency_performance();
CREATE OR REPLACE FUNCTION public.get_agency_performance() RETURNS TABLE (
        agency_id UUID,
        agency_name TEXT,
        agency_email TEXT,
        total_revenue NUMERIC,
        total_shipments BIGINT,
        total_packages BIGINT,
        total_weight NUMERIC,
        total_volume NUMERIC
    ) AS $$ BEGIN RETURN QUERY
SELECT p.id as agency_id,
    COALESCE(p.company_name, p.full_name) as agency_name,
    p.email as agency_email,
    COALESCE(SUM(s.price), 0)::NUMERIC as total_revenue,
    COUNT(s.id)::BIGINT as total_shipments,
    COALESCE(SUM(s.cargo_packages), 0)::BIGINT as total_packages,
    COALESCE(SUM(s.cargo_weight), 0)::NUMERIC as total_weight,
    COALESCE(SUM(s.cargo_volume), 0)::NUMERIC as total_volume
FROM public.profiles p
    LEFT JOIN public.shipments s ON s.forwarder_id = p.id
WHERE p.role = 'forwarder'
GROUP BY p.id,
    p.company_name,
    p.full_name,
    p.email
ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 2. Global Business KPIs (Current vs Previous Month)
DROP FUNCTION IF EXISTS public.get_business_kpis();
CREATE OR REPLACE FUNCTION public.get_business_kpis() RETURNS JSON AS $$
DECLARE current_month_start TIMESTAMP := DATE_TRUNC('month', NOW());
last_month_start TIMESTAMP := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
last_month_end TIMESTAMP := DATE_TRUNC('month', NOW()) - INTERVAL '1 second';
total_rev_curr NUMERIC;
total_rev_prev NUMERIC;
total_ship_curr BIGINT;
total_ship_prev BIGINT;
total_clients BIGINT;
active_forwarders BIGINT;
BEGIN -- Current Month Stats
SELECT COALESCE(SUM(price), 0),
    COUNT(id) INTO total_rev_curr,
    total_ship_curr
FROM shipments
WHERE created_at >= current_month_start;
-- Previous Month Stats
SELECT COALESCE(SUM(price), 0),
    COUNT(id) INTO total_rev_prev,
    total_ship_prev
FROM shipments
WHERE created_at >= last_month_start
    AND created_at <= last_month_end;
-- Totals
SELECT COUNT(*) INTO total_clients
FROM profiles
WHERE role = 'client';
SELECT COUNT(DISTINCT forwarder_id) INTO active_forwarders
FROM shipments;
RETURN json_build_object(
    'revenue',
    json_build_object(
        'current',
        total_rev_curr,
        'previous',
        total_rev_prev,
        'trend',
        CASE
            WHEN total_rev_prev = 0 THEN 100
            ELSE ROUND(
                (
                    (total_rev_curr - total_rev_prev) / total_rev_prev
                ) * 100
            )
        END
    ),
    'shipments',
    json_build_object(
        'current',
        total_ship_curr,
        'previous',
        total_ship_prev,
        'trend',
        CASE
            WHEN total_ship_prev = 0 THEN 100
            ELSE ROUND(
                (
                    (total_ship_curr - total_ship_prev) / total_ship_prev
                ) * 100
            )
        END
    ),
    'total_clients',
    total_clients,
    'active_agencies',
    active_forwarders
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;