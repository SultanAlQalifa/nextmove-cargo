-- Create sequences for each role type
CREATE SEQUENCE IF NOT EXISTS admin_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS forwarder_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS client_id_seq START 1;
-- Function to generate the friendly ID based on role
CREATE OR REPLACE FUNCTION generate_role_based_id() RETURNS TRIGGER AS $$
DECLARE prefix TEXT;
seq_name TEXT;
new_id TEXT;
BEGIN -- Determine prefix and sequence based on role
IF NEW.role IN ('admin', 'super-admin') THEN prefix := 'A';
seq_name := 'admin_id_seq';
ELSIF NEW.role = 'forwarder' THEN prefix := 'T';
seq_name := 'forwarder_id_seq';
ELSE -- Default to Client for 'client' role or any other
prefix := 'C';
seq_name := 'client_id_seq';
END IF;
-- Generate the ID: Prefix + 4 digits (padded with zeros)
-- e.g., A0001, T0042, C0123
new_id := prefix || LPAD(nextval(seq_name)::TEXT, 4, '0');
NEW.friendly_id := new_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop the old default if it exists (from previous migration)
ALTER TABLE profiles
ALTER COLUMN friendly_id DROP DEFAULT;
-- Create Trigger to automatically assign ID on INSERT
DROP TRIGGER IF EXISTS set_friendly_id_trigger ON profiles;
CREATE TRIGGER set_friendly_id_trigger BEFORE
INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION generate_role_based_id();
-- RE-GENERATE IDs for existing users
-- We need to do this carefully. We'll use a temporary function or anonymous block.
DO $$
DECLARE r RECORD;
prefix TEXT;
seq_name TEXT;
new_id TEXT;
BEGIN FOR r IN
SELECT *
FROM profiles
ORDER BY created_at ASC LOOP IF r.role IN ('admin', 'super-admin') THEN prefix := 'A';
seq_name := 'admin_id_seq';
ELSIF r.role = 'forwarder' THEN prefix := 'T';
seq_name := 'forwarder_id_seq';
ELSE prefix := 'C';
seq_name := 'client_id_seq';
END IF;
new_id := prefix || LPAD(nextval(seq_name)::TEXT, 4, '0');
UPDATE profiles
SET friendly_id = new_id
WHERE id = r.id;
END LOOP;
END $$;