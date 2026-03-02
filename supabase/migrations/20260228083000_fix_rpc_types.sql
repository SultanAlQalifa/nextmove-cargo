-- Migration to fix the RPC type error and perform aggregation on the database side
DROP FUNCTION IF EXISTS public.get_global_user_distribution();
DROP FUNCTION IF EXISTS public.get_user_distribution_by_country();
CREATE OR REPLACE FUNCTION public.get_user_distribution_by_country() RETURNS TABLE(country TEXT, total BIGINT) AS $$ BEGIN RETURN QUERY
SELECT p.country::TEXT,
    COUNT(*)::BIGINT
FROM profiles p
WHERE p.country IS NOT NULL
    AND p.country != ''
GROUP BY p.country
ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;