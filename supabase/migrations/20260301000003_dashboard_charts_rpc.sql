-- Analytics RPCs for Financial Performance and Logistics Distribution
DROP FUNCTION IF EXISTS public.get_financial_performance();
CREATE OR REPLACE FUNCTION public.get_financial_performance() RETURNS TABLE(mois TIMESTAMPTZ, revenu NUMERIC) AS $$ BEGIN RETURN QUERY
SELECT DATE_TRUNC('month', r.created_at)::TIMESTAMPTZ as mois,
    COALESCE(SUM(o.total_price), SUM(r.budget_amount), 0)::NUMERIC as revenu
FROM rfq_requests r
    LEFT JOIN rfq_offers o ON o.rfq_id = r.id
    AND o.status = 'accepted'
WHERE r.status NOT IN ('draft', 'cancelled')
GROUP BY DATE_TRUNC('month', r.created_at)
ORDER BY mois ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
CREATE OR REPLACE FUNCTION public.get_logistics_distribution() RETURNS TABLE(name TEXT, value BIGINT) AS $$ BEGIN RETURN QUERY
SELECT cargo_type::TEXT as name,
    COUNT(*)::BIGINT as value
FROM rfq_requests
WHERE status NOT IN ('draft', 'cancelled')
GROUP BY cargo_type
ORDER BY value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;