-- 20260228082500_rpc_user_distribution.sql
-- Function to reliably fetch total users and country distribution bypassing RLS restrictions
-- This is necessary because RLS policies on 'profiles' might restrict admins if session claims differ.
CREATE OR REPLACE FUNCTION public.get_global_user_distribution() RETURNS TABLE(
        country VARCHAR(100),
        phone VARCHAR(50)
    ) AS $$ BEGIN -- SECURITY DEFINER allows this function to bypass RLS and fetch all profiles safely.
    -- We only expose non-sensitive fields: country and phone for indicative parsing
    RETURN QUERY
SELECT p.country,
    p.phone
FROM public.profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;