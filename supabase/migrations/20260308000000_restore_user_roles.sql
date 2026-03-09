-- ═══════════════════════════════════════════════════════════════
-- RESTORE USER ROLES FROM METADATA & SUBSCRIPTIONS
-- Fixes the issue where all users were forced to 'super-admin'
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE r RECORD;
super_admin_role_id TEXT;
admin_role_id TEXT;
BEGIN -- 1. Drop blocking triggers and bypass role checks
PERFORM set_config('app.bypass_role_check', 'on', true);
DROP TRIGGER IF EXISTS check_role_change ON public.profiles;
DROP TRIGGER IF EXISTS check_role_integrity ON public.profiles;
-- 2. Fetch staff role IDs for administrative accounts
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
-- 3. Reset roles based on raw_user_meta_data or default to 'client'
FOR r IN
SELECT id,
    raw_user_meta_data
FROM auth.users LOOP
UPDATE public.profiles
SET role = COALESCE(r.raw_user_meta_data->>'role', 'client')::user_role,
    staff_role_id = NULL -- Clear staff role for now, will reset for admins below
WHERE id = r.id;
END LOOP;
-- 4. Re-apply promotion for users with active subscriptions (Clients -> Forwarders)
UPDATE public.profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE role = 'client'::user_role
    AND id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    );
-- 5. Force-fix specific administrative accounts
-- Fix Super Admin: wandifaproperties@gmail.com
UPDATE public.profiles
SET role = 'super-admin'::user_role,
    staff_role_id = super_admin_role_id,
    account_status = 'active'
WHERE email = 'wandifaproperties@gmail.com';
-- Fix Admin: khadidiaoudiop053@gmail.com
UPDATE public.profiles
SET role = 'admin'::user_role,
    staff_role_id = admin_role_id,
    account_status = 'active'
WHERE email = 'khadidiaoudiop053@gmail.com';
-- 6. Re-create the triggers safely
-- check_role_change
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_change'
) THEN CREATE TRIGGER check_role_change BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
END IF;
-- check_role_integrity
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
-- 7. Restore role check enforcement
PERFORM set_config('app.bypass_role_check', 'off', true);
RAISE NOTICE 'User roles successfully restored from metadata and subscriptions.';
END $$;