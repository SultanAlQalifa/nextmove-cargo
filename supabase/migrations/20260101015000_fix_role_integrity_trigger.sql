-- Migration: Fix Role Integrity Trigger (Enum Cast Issue)
CREATE OR REPLACE FUNCTION check_role_integrity() RETURNS TRIGGER AS $$
DECLARE v_family text;
BEGIN -- If no staff role assigned, we only ensure role is 'client' or 'driver' or 'forwarder'
-- Actually, if staff_role_id is NULL, user is usually a client or individual forwarder.
-- Strictness: If staff_role_id IS NOT NULL, enforced match.
IF NEW.staff_role_id IS NOT NULL THEN
SELECT role_family INTO v_family
FROM staff_roles
WHERE id = NEW.staff_role_id;
-- FIX: Cast NEW.role to text to avoid enum errors when comparing with literals
IF v_family = 'admin'
AND NEW.role::text NOT IN ('admin', 'super-admin', 'support', 'finance') THEN RAISE EXCEPTION 'Integrity Error: User with Admin Family Role must have an admin-type role (admin, super-admin, support, finance). Attempted: %',
NEW.role;
END IF;
IF v_family = 'forwarder'
AND NEW.role::text <> 'forwarder' THEN RAISE EXCEPTION 'Integrity Error: User with Forwarder Family Role must have role "forwarder". Attempted: %',
NEW.role;
END IF;
IF v_family = 'client'
AND NEW.role::text <> 'client' THEN RAISE EXCEPTION 'Integrity Error: User with Client Family Role must have role "client". Attempted: %',
NEW.role;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;