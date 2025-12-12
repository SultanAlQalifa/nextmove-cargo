-- SCRIPT DE CORRECTION: Rétrograder Afriflux (Super-Admin -> Transitaire)
-- Ce script corrige le rôle de l'utilisateur Afriflux qui a été élevé par erreur.
BEGIN;
-- 1. Identifier l'utilisateur Afriflux (par email ou nom entreprise)
DO $$
DECLARE v_afriflux_id UUID;
BEGIN
SELECT id INTO v_afriflux_id
FROM profiles
WHERE company_name ILIKE '%Afriflux%'
    OR email ILIKE '%afriflux%';
IF v_afriflux_id IS NOT NULL THEN -- 2. Mettre à jour le rôle
UPDATE profiles
SET role = 'forwarder',
    staff_role_id = NULL -- S'assurer qu'il n'est pas lié à un rôle admin
WHERE id = v_afriflux_id;
RAISE NOTICE '✅ Afriflux (ID: %) a été rétrogradé de Super-Admin à Transitaire.',
v_afriflux_id;
ELSE RAISE NOTICE '⚠️ Utilisateur Afriflux non trouvé.';
END IF;
END $$;
COMMIT;