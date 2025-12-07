-- 059_add_role_family.sql
-- Add explicit family hierarchy to staff_roles table
DO $$ BEGIN -- 1. Add role_family column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_roles'
        AND column_name = 'role_family'
) THEN
ALTER TABLE staff_roles
ADD COLUMN role_family text;
-- 2. Add Constraint to ensure valid families
ALTER TABLE staff_roles
ADD CONSTRAINT check_role_family CHECK (role_family IN ('admin', 'forwarder', 'client'));
-- 3. Backfill Data
UPDATE staff_roles
SET role_family = 'admin'
WHERE name ILIKE '%Admin%';
UPDATE staff_roles
SET role_family = 'admin'
WHERE name ILIKE 'Administrateur';
UPDATE staff_roles
SET role_family = 'forwarder'
WHERE name ILIKE 'Transitaire';
UPDATE staff_roles
SET role_family = 'client'
WHERE name ILIKE 'Client%';
-- Default any NULLs to 'admin' (Safe default for orphan system roles)
UPDATE staff_roles
SET role_family = 'admin'
WHERE role_family IS NULL;
-- 4. Enforce Not Null
ALTER TABLE staff_roles
ALTER COLUMN role_family
SET NOT NULL;
END IF;
END $$;