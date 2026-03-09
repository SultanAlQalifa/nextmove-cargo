-- 058_ensure_system_roles.sql
-- Ensure Critical System Roles Exist using ID-agnostic upsert logic
-- This prevents the "Super Admin missing" issue from ever reoccurring
-- 1. Ensure Super Admin exists (role_family awareness)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_roles'
        AND column_name = 'role_family'
) THEN IF NOT EXISTS (
    SELECT 1
    FROM staff_roles
    WHERE name ILIKE 'Super Admin'
) THEN
INSERT INTO staff_roles (
        id,
        name,
        description,
        permissions,
        is_system,
        role_family
    )
VALUES (
        'super-admin',
        'Super Admin',
        'Administrateur Système (Accès Total)',
        ARRAY ['all'],
        true,
        'admin'
    );
RAISE NOTICE 'Created missing Super Admin role';
ELSE
UPDATE staff_roles
SET permissions = ARRAY ['all'],
    is_system = true,
    role_family = 'admin'
WHERE name ILIKE 'Super Admin';
END IF;
ELSE IF NOT EXISTS (
    SELECT 1
    FROM staff_roles
    WHERE name ILIKE 'Super Admin'
) THEN
INSERT INTO staff_roles (id, name, description, permissions, is_system)
VALUES (
        'super-admin',
        'Super Admin',
        'Administrateur Système (Accès Total)',
        ARRAY ['all'],
        true
    );
RAISE NOTICE 'Created missing Super Admin role';
ELSE
UPDATE staff_roles
SET permissions = ARRAY ['all'],
    is_system = true
WHERE name ILIKE 'Super Admin';
END IF;
END IF;
END $$;
-- 2. Ensure Administrateur exists (role_family awareness)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_roles'
        AND column_name = 'role_family'
) THEN IF NOT EXISTS (
    SELECT 1
    FROM staff_roles
    WHERE name ILIKE 'Administrateur'
        OR name ILIKE 'Admin'
) THEN
INSERT INTO staff_roles (
        name,
        description,
        permissions,
        is_system,
        role_family
    )
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
        true,
        'admin'
    );
RAISE NOTICE 'Created missing Administrateur role';
END IF;
ELSE IF NOT EXISTS (
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
END IF;
END $$;