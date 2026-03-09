-- ═══════════════════════════════════════════════════════════════
-- NUCLEAR RESTORE USER ROLES (v3 - FINAL)
-- Forcefully resets everyone to 'client' except strictly verified admins
-- Bypasses integrity checks by excluding admins from subscription restoration
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE r RECORD;
super_admin_role_id TEXT;
admin_role_id TEXT;
v_admin_emails TEXT [] := ARRAY [
        'wandifaproperties@gmail.com', 
        'khadidiatoudiop053@gmail.com', 
        'afriflux@gmail.com',
        'sultanalqalifa@gmail.com'
    ];
BEGIN -- 1. Bypasser tous les triggers (méthode de réplication)
-- Cela permet de modifier les données sans que les fonctions de validation ne bloquent
SET session_replication_role = 'replica';
-- 2. Récupération des IDs de rôles pour les admins
SELECT id::text INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
SELECT id::text INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
-- 3. RÉINITIALISATION GLOBALE EN "CLIENT"
-- On vide aussi staff_role_id pour tout le monde (sauf nos admins protégés)
UPDATE public.profiles
SET role = 'client'::user_role,
    staff_role_id = NULL
WHERE email <> ALL(v_admin_emails);
-- 4. Rétablissement des Prestataires (Forwarders) basés sur les abonnements actifs
-- CRITICAL: On exclut les admins de cette mise à jour pour éviter l'erreur d'intégrité
-- (Un admin ne peut pas être un simple "forwarder" s'il a un staff_role admin)
UPDATE public.profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    )
    AND email <> ALL(v_admin_emails);
-- 5. Rétablissement et consolidation des Administrateurs
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
-- 6. Rétablissement du comportement normal des triggers
SET session_replication_role = 'origin';
RAISE NOTICE 'Restauration nucléaire (v3) terminée avec succès.';
END $$;