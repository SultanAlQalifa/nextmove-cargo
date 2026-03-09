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
END IF;
-- 2. Add/Refresh Constraint to ensure valid families
-- Drop first to be safe during bulk push
ALTER TABLE staff_roles DROP CONSTRAINT IF EXISTS check_role_family;
ALTER TABLE staff_roles
ADD CONSTRAINT check_role_family CHECK (role_family IN ('admin', 'forwarder', 'client'));
-- 3. Backfill Data
UPDATE staff_roles
SET role_family = 'admin'
WHERE name ILIKE '%Admin%'
    AND role_family IS NULL;
UPDATE staff_roles
SET role_family = 'admin'
WHERE name ILIKE 'Administrateur'
    AND role_family IS NULL;
UPDATE staff_roles
SET role_family = 'forwarder'
WHERE name ILIKE 'Transitaire'
    AND role_family IS NULL;
UPDATE staff_roles
SET role_family = 'client'
WHERE name ILIKE 'Client%'
    AND role_family IS NULL;
-- Default any NULLs to 'admin' (Safe default for orphan system roles)
UPDATE staff_roles
SET role_family = 'admin'
WHERE role_family IS NULL;
-- 4. Enforce Not Null
ALTER TABLE staff_roles
ALTER COLUMN role_family
SET NOT NULL;
END $$;