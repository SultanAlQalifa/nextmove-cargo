-- 058_ensure_system_roles.sql
-- Ensure Critical System Roles Exist using ID-agnostic upsert logic
-- This prevents the "Super Admin missing" issue from ever reoccurring
DO $$ BEGIN -- 1. Ensure Super Admin exists
-- We match on NAME because IDs might vary across environments if auto-generated
-- But we enforce is_system=true
IF NOT EXISTS (
    SELECT 1
    FROM staff_roles
    WHERE name ILIKE 'Super Admin'
) THEN
INSERT INTO staff_roles (id, name, description, permissions, is_system)
VALUES (
        'super-admin',
        -- Use explicit slug if possible, or gen_random_uuid()
        'Super Admin',
        'Administrateur Système (Accès Total)',
        ARRAY ['all'],
        true
    );
RAISE NOTICE 'Created missing Super Admin role';
ELSE -- Update existing to be sure it has 'all' permissions and is_system=true
UPDATE staff_roles
SET permissions = ARRAY ['all'],
    is_system = true
WHERE name ILIKE 'Super Admin';
END IF;
-- 2. Ensure Administrateur exists
IF NOT EXISTS (
    SELECT 1
    FROM staff_roles
    WHERE name ILIKE 'Administrateur'
        OR name ILIKE 'Admin'
) THEN
INSERT INTO staff_roles (name, description, permissions, is_system)
VALUES (
        'Administrateur',
        'Gestionnaire Global (Sauf Système)',
        ARRAY [
                'shipments.view', 'shipments.create', 'shipments.edit', 'shipments.delete', 'shipments.status',
                'personnel.view', 'personnel.create', 'personnel.edit', 'personnel.delete', 'personnel.roles',
                'finance.view', 'finance.create', 'finance.payments', 'finance.reports',
                'support.view', 'support.respond', 'support.manage',
                'settings.view', 'settings.manage'
            ],
        true
    );
RAISE NOTICE 'Created missing Administrateur role';
END IF;
-- 3. Ensure Transitaire exists in staff_roles IF we are using it for permission mapping
-- (Usually Transitaire is just a base role enum, but if we want granular permissions for them...)
-- For now, we skip Transitaire as it is handled by the 'forwarder' base role enum in most logic.
END $$;