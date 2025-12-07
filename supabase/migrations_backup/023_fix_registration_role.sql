-- Fix Registration Role Assignment
-- Allow users to change their role from 'client' to other non-admin roles during registration
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$ BEGIN -- Allow bypassing if config is set (used by admin functions)
    IF current_setting('app.bypass_role_check', true) = 'on' THEN RETURN NEW;
END IF;
-- Check if role is actually changing
IF (
    TG_OP = 'UPDATE'
    AND OLD.role IS DISTINCT
    FROM NEW.role
) THEN -- Allow if user is admin/super-admin
IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
        AND role IN ('admin', 'super-admin')
) THEN RETURN NEW;
END IF;
-- Allow if user is updating their own role from 'client' to 'forwarder', 'supplier', or 'driver'
-- AND they are not trying to become an admin
IF auth.uid() = NEW.id
AND OLD.role = 'client'
AND NEW.role IN ('forwarder', 'supplier', 'driver') THEN RETURN NEW;
END IF;
-- Otherwise, deny
RAISE EXCEPTION 'Non autorisé à changer votre propre rôle.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;