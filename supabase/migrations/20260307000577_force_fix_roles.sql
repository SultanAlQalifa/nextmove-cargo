-- Force fix specific users to their correct roles
-- 1. Fixed Super Admin: wandifaproperties@gmail.com
DO $$
DECLARE super_admin_role_id TEXT;
admin_role_id TEXT;
BEGIN -- Drop triggers that might block role updates
DROP TRIGGER IF EXISTS check_role_change ON public.profiles;
DROP TRIGGER IF EXISTS check_role_integrity ON public.profiles;
-- Bypass the role change trigger for migration
PERFORM set_config('app.bypass_role_check', 'on', true);
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
UPDATE profiles
SET role = 'super-admin'::user_role,
    staff_role_id = super_admin_role_id,
    -- NO CAST to uuid, remote expects text/id
    account_status = 'active'::account_status
WHERE email = 'wandifaproperties@gmail.com';
RAISE NOTICE 'Fixed Super Admin: wandifaproperties@gmail.com';
-- 2. Fixed Admin: khadidiaoudiop053@gmail.com
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
UPDATE profiles
SET role = 'admin'::user_role,
    staff_role_id = admin_role_id,
    forwarder_id = NULL -- Ensure not linked to any forwarder
WHERE email = 'khadidiaoudiop053@gmail.com';
RAISE NOTICE 'Fixed Admin: khadidiaoudiop053@gmail.com';
-- Reset bypass
PERFORM set_config('app.bypass_role_check', 'off', true);
-- Re-create check_role_change trigger
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_change'
) THEN CREATE TRIGGER check_role_change BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
END IF;
-- Re-create check_role_integrity trigger
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_integrity'
) THEN CREATE TRIGGER check_role_integrity
AFTER
INSERT
    OR
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION check_role_integrity();
END IF;
EXCEPTION
WHEN OTHERS THEN -- Final fallback to ensure triggers are back
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_change'
) THEN CREATE TRIGGER check_role_change BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_integrity'
) THEN CREATE TRIGGER check_role_integrity
AFTER
INSERT
    OR
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION check_role_integrity();
END IF;
RAISE;
END $$;