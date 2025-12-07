-- 1. Allow deleting roles by setting user references to NULL
-- This ensures that if you delete a role (e.g. 'Manager'), users who had it won't break, they just lose the role.
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_staff_role_id_fkey'
) THEN
ALTER TABLE profiles DROP CONSTRAINT profiles_staff_role_id_fkey;
END IF;
END $$;
ALTER TABLE profiles
ADD CONSTRAINT profiles_staff_role_id_fkey FOREIGN KEY (staff_role_id) REFERENCES staff_roles(id) ON DELETE
SET NULL;
-- 2. Prevent deletion of 'Super Admin' role specifically
-- This adds a safety check in the database
CREATE OR REPLACE FUNCTION prevent_super_admin_deletion() RETURNS TRIGGER AS $$ BEGIN IF OLD.name = 'Super Admin' THEN RAISE EXCEPTION 'Impossible de supprimer le rôle Super Admin';
END IF;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS check_role_deletion ON staff_roles;
CREATE TRIGGER check_role_deletion BEFORE DELETE ON staff_roles FOR EACH ROW EXECUTE FUNCTION prevent_super_admin_deletion();