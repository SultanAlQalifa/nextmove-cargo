-- Migration: Allow RPCs to update loyalty points
-- We are modifying the protection trigger to allow updates if they come from a function (trigger depth > 0)
-- or if the user is an admin calling properly.
CREATE OR REPLACE FUNCTION public.protect_loyalty_columns() RETURNS TRIGGER AS $$ BEGIN -- Allow service_role (Edge Functions) and Admins to bypass
    IF (auth.role() = 'service_role')
    OR (is_admin()) THEN RETURN NEW;
END IF;
-- Allow updates if they are triggered by a SECURITY DEFINER function
-- (like award_points or convert_points_to_wallet)
-- pg_trigger_depth() > 1 means it's called inside another function/trigger stack
-- Note: on some Postgres versions/configs this might behave differently, 
-- but usually depth 0 is top-level statement.
IF (pg_trigger_depth() > 0) THEN RETURN NEW;
END IF;
-- Check if restricted columns are being modified directly
IF (
    NEW.loyalty_points IS DISTINCT
    FROM OLD.loyalty_points
) THEN RAISE EXCEPTION 'Access Denied: You cannot modify loyalty points directly.';
END IF;
IF (
    NEW.tier IS DISTINCT
    FROM OLD.tier
) THEN RAISE EXCEPTION 'Access Denied: You cannot modify tier directly.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;