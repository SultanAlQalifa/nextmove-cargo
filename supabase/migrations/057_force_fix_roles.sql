-- Force fix specific users to their correct roles
-- 1. Fix Super Admin (wandifaproperties@gmail.com)
DO $$
DECLARE super_admin_role_id UUID;
admin_role_id UUID;
BEGIN
SELECT id INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
UPDATE profiles
SET role = 'super-admin',
    staff_role_id = super_admin_role_id,
    account_status = 'active'
WHERE email = 'wandifaproperties@gmail.com';
RAISE NOTICE 'Fixed Super Admin: wandifaproperties@gmail.com';
-- 2. Fix Admin (khadidiaoudiop053@gmail.com) who appears as Transitaire
SELECT id INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Administrateur'
    OR name ILIKE 'Admin'
LIMIT 1;
UPDATE profiles
SET role = 'admin',
    staff_role_id = admin_role_id,
    forwarder_id = NULL -- Ensure not linked to any forwarder
WHERE email = 'khadidiaoudiop053@gmail.com';
RAISE NOTICE 'Fixed Admin: khadidiaoudiop053@gmail.com';
END $$;