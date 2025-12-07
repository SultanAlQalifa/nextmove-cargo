-- Link existing 'super-admin' or 'admin' profiles to their corresponding staff_roles entry
-- This fixes the issue where profiles created via Auth/Trigger are missing the relation to staff_roles table
DO $$
DECLARE super_admin_role_id UUID;
admin_role_id UUID;
forwarder_role_id UUID;
BEGIN -- 1. Get IDs from staff_roles
-- Note: Migration 007 seeded 'Super Admin' (Title Case)
SELECT id INTO super_admin_role_id
FROM staff_roles
WHERE name ILIKE 'Super Admin'
LIMIT 1;
-- In case 'Admin' or 'Forwarder' roles exist in staff_roles (they might not if only system roles were seeded)
-- We'll try to find them or create them if needed for consistency, but primarily focusing on Super Admin fix.
-- 2. Fix Super Admin Profiles
IF super_admin_role_id IS NOT NULL THEN RAISE NOTICE 'Linking super-admin profiles to staff_role %',
super_admin_role_id;
UPDATE profiles
SET staff_role_id = super_admin_role_id
WHERE role = 'super-admin'
    AND staff_role_id IS NULL;
-- Also fix any that might have role='admin' but email is the super admin email (if known) or just generic mapping?
-- For now, strict mapping based on enum 'super-admin'.
ELSE RAISE WARNING 'Super Admin role not found in staff_roles table!';
END IF;
-- 3. Ensure "Admin" role exists in staff_roles so we can map 'admin' users
SELECT id INTO admin_role_id
FROM staff_roles
WHERE name ILIKE 'Admin'
    OR name ILIKE 'Administrateur'
LIMIT 1;
IF admin_role_id IS NULL THEN
INSERT INTO staff_roles (name, description, permissions, is_system)
VALUES (
        'Administrateur',
        'Accès complet (sauf système)',
        ARRAY ['all'],
        false
    )
RETURNING id INTO admin_role_id;
END IF;
-- Link 'admin' profiles to this role
IF admin_role_id IS NOT NULL THEN
UPDATE profiles
SET staff_role_id = admin_role_id
WHERE role = 'admin'
    AND staff_role_id IS NULL;
END IF;
END $$;