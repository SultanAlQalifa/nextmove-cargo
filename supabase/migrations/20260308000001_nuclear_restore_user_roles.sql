-- ═══════════════════════════════════════════════════════════════
-- NUCLEAR RESTORE USER ROLES (v2)
-- Forcefully resets everyone to 'client' except strictly verified admins
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE r RECORD;
super_admin_role_id TEXT;
admin_role_id TEXT;
BEGIN -- 1. Setup
PERFORM set_config('app.bypass_role_check', 'on', true);
DROP TRIGGER IF EXISTS check_role_change ON public.profiles;
DROP TRIGGER IF EXISTS check_role_integrity ON public.profiles;
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
-- 2. RÉINITIALISATION GLOBALE EN "CLIENT"
-- On exclut les emails administrateurs pour ne pas vous bloquer
UPDATE public.profiles
SET role = 'client'::user_role,
    staff_role_id = NULL
WHERE email NOT IN (
        'wandifaproperties@gmail.com',
        'khadidiatoudiop053@gmail.com',
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    );
-- 3. Rétablissement des Prestataires (Forwarders) basés sur les abonnements actifs
UPDATE public.profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    );
-- 4. Rétablissement précis des Administrateurs
UPDATE public.profiles
SET role = 'super-admin'::user_role,
    staff_role_id = super_admin_role_id,
    account_status = 'active'
WHERE email IN (
        'wandifaproperties@gmail.com',
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    );
UPDATE public.profiles
SET role = 'admin'::user_role,
    staff_role_id = admin_role_id,
    account_status = 'active'
WHERE email = 'khadidiatoudiop053@gmail.com';
-- 5. Restauration des triggers de sécurité
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
PERFORM set_config('app.bypass_role_check', 'off', true);
RAISE NOTICE 'Restauration nucléaire des rôles terminée avec succès.';
END $$;