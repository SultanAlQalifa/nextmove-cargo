-- Migration to aggregate RFQ routes for Global Operations Dashboard
CREATE OR REPLACE FUNCTION public.get_active_routes_stats() RETURNS TABLE(
        origin_port TEXT,
        destination_port TEXT,
        route_count BIGINT,
        total_weight NUMERIC
    ) AS $$ BEGIN RETURN QUERY
SELECT r.origin_port::TEXT,
    r.destination_port::TEXT,
    COUNT(*)::BIGINT AS route_count,
    COALESCE(SUM(r.weight_kg), 0)::NUMERIC AS total_weight
FROM rfq_requests r
WHERE r.status NOT IN ('draft', 'cancelled')
GROUP BY r.origin_port,
    r.destination_port
ORDER BY route_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;