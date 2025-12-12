-- Secure Loyalty Points Column
-- Prevent users from updating their own loyalty points or tier directly via API
CREATE OR REPLACE FUNCTION public.protect_loyalty_columns() RETURNS TRIGGER AS $$ BEGIN -- Allow service_role (Edge Functions) and Admins to bypass
    IF (auth.role() = 'service_role')
    OR (is_admin()) THEN RETURN NEW;
END IF;
-- Check if restricted columns are being modified
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
DROP TRIGGER IF EXISTS protect_loyalty_columns_trigger ON public.profiles;
CREATE TRIGGER protect_loyalty_columns_trigger BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_loyalty_columns();