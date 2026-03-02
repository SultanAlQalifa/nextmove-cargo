-- Migration to add a secure RPC for fetching the total user count
CREATE OR REPLACE FUNCTION public.get_total_users_count() RETURNS BIGINT AS $$ BEGIN RETURN (
        SELECT COUNT(*)::BIGINT
        FROM public.profiles
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;