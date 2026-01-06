-- ====================================================================
-- DYNAMIC FRIENDLY ID: PREFIX SWITCHING & ROLE UPDATES
-- ====================================================================
BEGIN;
-- 1. Ensure sequences exist (preserving existing values)
CREATE SEQUENCE IF NOT EXISTS admin_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS forwarder_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS client_id_seq START 1;
-- 2. Update the ID generation function
CREATE OR REPLACE FUNCTION generate_role_based_id() RETURNS TRIGGER AS $$
DECLARE prefix TEXT;
seq_name TEXT;
new_id TEXT;
BEGIN -- Only trigger if it's an INSERT OR the role has changed during UPDATE
IF (TG_OP = 'INSERT')
OR (
    NEW.role IS DISTINCT
    FROM OLD.role
) THEN -- Determine prefix and sequence based on role
IF NEW.role IN ('admin', 'super-admin') THEN prefix := 'A';
seq_name := 'admin_id_seq';
ELSIF NEW.role = 'forwarder' THEN prefix := 'P';
-- Switched from 'T' to 'P' for Prestataire
seq_name := 'forwarder_id_seq';
ELSE -- Default to Client
prefix := 'C';
seq_name := 'client_id_seq';
END IF;
-- Generate a NEW unique ID for the NEW role
new_id := prefix || LPAD(nextval(seq_name)::TEXT, 4, '0');
NEW.friendly_id := new_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. Update the Trigger to handle UPDATEs on 'role' column
DROP TRIGGER IF EXISTS set_friendly_id_trigger ON profiles;
CREATE TRIGGER set_friendly_id_trigger BEFORE
INSERT
    OR
UPDATE OF role ON profiles FOR EACH ROW EXECUTE FUNCTION generate_role_based_id();
-- 4. Retroactive fix for existing Prestataires
-- This will convert any existing 'Txxxx' or 'Cxxxx' (if they are forwarders) to 'Pxxxx'
DO $$
DECLARE r RECORD;
prefix TEXT;
seq_name TEXT;
new_id TEXT;
BEGIN FOR r IN (
    SELECT id,
        role,
        friendly_id
    FROM profiles
    WHERE (
            role = 'forwarder'
            AND (
                friendly_id NOT LIKE 'P%'
                OR friendly_id IS NULL
            )
        )
        OR (
            role IN ('admin', 'super-admin')
            AND (
                friendly_id NOT LIKE 'A%'
                OR friendly_id IS NULL
            )
        )
        OR (
            role = 'client'
            AND (
                friendly_id NOT LIKE 'C%'
                OR friendly_id IS NULL
            )
        )
) LOOP IF r.role IN ('admin', 'super-admin') THEN prefix := 'A';
seq_name := 'admin_id_seq';
ELSIF r.role = 'forwarder' THEN prefix := 'P';
seq_name := 'forwarder_id_seq';
ELSE prefix := 'C';
seq_name := 'client_id_seq';
END IF;
new_id := prefix || LPAD(nextval(seq_name)::TEXT, 4, '0');
UPDATE profiles
SET friendly_id = new_id
WHERE id = r.id;
RAISE NOTICE 'Updated ID for %: % -> %',
r.id,
r.friendly_id,
new_id;
END LOOP;
END $$;
COMMIT;
SELECT 'DYNAMIC IDs ENABLED & FORWARDERS UPDATED TO P' as status;