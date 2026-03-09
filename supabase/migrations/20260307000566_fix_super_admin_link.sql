-- Link existing 'super-admin' or 'admin' profiles to their corresponding staff_roles entry
-- This fixes the issue where profiles created via Auth/Trigger are missing the relation to staff_roles table
DO $$
DECLARE -- We use TEXT because staff_roles.id is actually TEXT on remote (e.g. 'admin', 'super-admin')
    super_admin_role_id TEXT;
admin_role_id TEXT;
BEGIN -- Drop triggers that might block role updates
DROP TRIGGER IF EXISTS check_role_change ON public.profiles;
DROP TRIGGER IF EXISTS check_role_integrity ON public.profiles;
-- 1. Get IDs from staff_roles
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
-- 2. Fix Super Admin Profiles
IF super_admin_role_id IS NOT NULL THEN RAISE NOTICE 'Linking super-admin profiles to staff_role %',
super_admin_role_id;
UPDATE profiles
SET staff_role_id = super_admin_role_id -- NO CAST to uuid, remote expects text/id
WHERE role = 'super-admin'
    AND (
        staff_role_id IS NULL
        OR staff_role_id::text <> super_admin_role_id
    );
ELSE RAISE WARNING 'Super Admin role not found in staff_roles table!';
END IF;
-- 3. Ensure "Admin" role exists in staff_roles
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Admin'
    OR name ILIKE 'Administrateur'
LIMIT 1;
-- Link 'admin' profiles to this role
IF admin_role_id IS NOT NULL THEN
UPDATE profiles
SET staff_role_id = admin_role_id
WHERE role = 'admin'
    AND (
        staff_role_id IS NULL
        OR staff_role_id::text <> admin_role_id
    );
END IF;
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
END $$;