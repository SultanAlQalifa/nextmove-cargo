-- Migration to fix Community Analytics RPC parameter and column references
-- 1. Fix user_role casting in distribution by role
CREATE OR REPLACE FUNCTION public.get_detailed_user_distribution(role_filter TEXT DEFAULT NULL) RETURNS TABLE(country TEXT, total BIGINT) AS $$ BEGIN RETURN QUERY
SELECT p.country::TEXT,
    COUNT(*)::BIGINT
FROM profiles p
WHERE p.country IS NOT NULL
    AND p.country != '' -- Cast p.role to text to match against the TEXT role_filter safely
    AND (
        role_filter IS NULL
        OR p.role::text = role_filter
    )
GROUP BY p.country
ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 2. Fix first_name missing column by using full_name in KPIs
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
-- Fixed: Using full_name instead of first_name and last_name
SELECT COUNT(*) INTO completed
FROM profiles
WHERE full_name IS NOT NULL
    AND full_name != ''
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