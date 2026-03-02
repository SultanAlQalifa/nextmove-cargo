-- Migration for Community Analytics Phase 7
-- 1. Detailed user distribution supporting role filters
DROP FUNCTION IF EXISTS public.get_detailed_user_distribution(TEXT);
CREATE OR REPLACE FUNCTION public.get_detailed_user_distribution(role_filter TEXT DEFAULT NULL) RETURNS TABLE(country TEXT, total BIGINT) AS $$ BEGIN RETURN QUERY
SELECT p.country::TEXT,
    COUNT(*)::BIGINT
FROM profiles p
WHERE p.country IS NOT NULL
    AND p.country != ''
    AND (
        role_filter IS NULL
        OR p.role = role_filter
    )
GROUP BY p.country
ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 2. User growth over time (Signups per month)
DROP FUNCTION IF EXISTS public.get_user_growth_by_month(TEXT);
CREATE OR REPLACE FUNCTION public.get_user_growth_by_month(country_filter TEXT DEFAULT NULL) RETURNS TABLE(month TEXT, signups BIGINT) AS $$ BEGIN RETURN QUERY
SELECT TO_CHAR(DATE_TRUNC('month', p.created_at), 'YYYY-MM') AS month,
    COUNT(*)::BIGINT AS signups
FROM profiles p
WHERE (
        country_filter IS NULL
        OR p.country = country_filter
    )
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY DATE_TRUNC('month', p.created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 3. Simple stats summarizing completion rates and weekly new
DROP FUNCTION IF EXISTS public.get_community_kpis();
CREATE OR REPLACE FUNCTION public.get_community_kpis() RETURNS TABLE(
        total_users BIGINT,
        total_countries BIGINT,
        new_this_week BIGINT,
        completion_rate NUMERIC
    ) AS $$
DECLARE tot BIGINT;
countries BIGINT;
new_week BIGINT;
completed BIGINT;
c_rate NUMERIC;
BEGIN
SELECT COUNT(*) INTO tot
FROM profiles;
SELECT COUNT(DISTINCT country) INTO countries
FROM profiles
WHERE country IS NOT NULL
    AND country != '';
SELECT COUNT(*) INTO new_week
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days';
SELECT COUNT(*) INTO completed
FROM profiles
WHERE first_name IS NOT NULL
    AND last_name IS NOT NULL
    AND phone IS NOT NULL
    AND country IS NOT NULL;
IF tot > 0 THEN c_rate := ROUND((completed::NUMERIC / tot::NUMERIC) * 100, 2);
ELSE c_rate := 0;
END IF;
RETURN QUERY
SELECT tot,
    countries,
    new_week,
    c_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;