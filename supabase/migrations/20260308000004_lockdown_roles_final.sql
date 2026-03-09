-- ═══════════════════════════════════════════════════════════════
-- LOCKDOWN: SINGLE SUPER-ADMIN ENFORCEMENT & AUTH CLEANUP
-- Verrouillage total pour garantir qu'un seul utilisateur est Super-Admin
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE super_admin_email TEXT := 'wandifaproperties@gmail.com';
super_admin_role_id TEXT;
admin_role_id TEXT;
BEGIN -- 1. Bypasser les triggers pour le nettoyage initial
SET session_replication_role = 'replica';
-- 2. NETTOYAGE DES MÉTADONNÉES AUTH (La source du problème)
-- On supprime le champ 'role' des métadonnées pour TOUS sauf le propriétaire
-- Cela évite que Supabase ne ré-injecte 'super-admin' lors de la connexion
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email <> super_admin_email;
-- 3. RÉCUPÉRATION DES ROLES STAFF
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
-- 4. RÉINITIALISATION DES PROFILS CORROMPUS
-- On repasse tout le monde en 'client' sauf les admins connus
UPDATE public.profiles
SET role = 'client'::user_role,
    staff_role_id = NULL
WHERE email NOT IN (
        super_admin_email,
        'khadidiatoudiop053@gmail.com',
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    );
-- 5. ATTRIBUTION DES RÔLES ADMINS CORRECTS
-- Un SEUL Super-admin
UPDATE public.profiles
SET role = 'super-admin'::user_role,
    staff_role_id = super_admin_role_id,
    account_status = 'active'
WHERE email = super_admin_email;
-- Les autres deviennent de simples Admins
UPDATE public.profiles
SET role = 'admin'::user_role,
    staff_role_id = admin_role_id,
    account_status = 'active'
WHERE email IN (
        'khadidiatoudiop053@gmail.com',
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    );
-- 6. RESTAURATION DES PRESTATAIRES (Abonnements actifs)
UPDATE public.profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    )
    AND email NOT IN (
        super_admin_email,
        'khadidiatoudiop053@gmail.com',
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    );
-- 7. INSTALLATION DU TRIGGER DE SÉCURITÉ INVIOLABLE
-- Cette fonction empêchera toute promotion future en super-admin sauf pour l'email maître
CREATE OR REPLACE FUNCTION public.enforce_role_lockdown() RETURNS TRIGGER AS $f$ BEGIN -- Bloquer toute tentative de devenir super-admin si ce n'est pas le bon email
    IF NEW.role = 'super-admin'
    AND NEW.email <> 'wandifaproperties@gmail.com' THEN RAISE EXCEPTION 'LOCKDOWN : Seul le propriétaire principal peut être Super-Admin.';
END IF;
-- Bloquer toute tentative de devenir admin si l'email n'est pas dans la liste blanche (par précaution)
IF NEW.role = 'admin'
AND NEW.email NOT IN (
    'wandifaproperties@gmail.com',
    'khadidiatoudiop053@gmail.com',
    'afriflux@gmail.com',
    'sultanalqalifa@gmail.com'
) THEN RAISE EXCEPTION 'LOCKDOWN : Accès administratif refusé pour cet utilisateur.';
END IF;
RETURN NEW;
END;
$f$ LANGUAGE plpgsql;
-- Activer le trigger de verrouillage
DROP TRIGGER IF EXISTS tr_role_lockdown ON public.profiles;
CREATE TRIGGER tr_role_lockdown BEFORE
INSERT
    OR
UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_role_lockdown();
-- 8. Restaurer le comportement normal
SET session_replication_role = 'origin';
RAISE NOTICE 'Lockdown complété : Un seul Super-Admin autorisé (%s).',
super_admin_email;
END $$;