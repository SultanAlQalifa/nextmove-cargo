-- Create a sequence for user IDs starting at 10000
CREATE SEQUENCE IF NOT EXISTS user_id_seq START 10000;
-- Function to generate the friendly ID
CREATE OR REPLACE FUNCTION generate_friendly_id() RETURNS TEXT AS $$ BEGIN RETURN 'USR-' || nextval('user_id_seq');
END;
$$ LANGUAGE plpgsql;
-- Add the column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS friendly_id TEXT UNIQUE DEFAULT generate_friendly_id();
-- Backfill existing users who might have null friendly_id (though default should handle it for new columns in Postgres 11+)
-- But just in case the default didn't apply to existing rows automatically (it does in modern PG, but good to be safe)
UPDATE profiles
SET friendly_id = generate_friendly_id()
WHERE friendly_id IS NULL;
-- Ensure the column is not null for future inserts
ALTER TABLE profiles
ALTER COLUMN friendly_id
SET NOT NULL;
-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_friendly_id ON profiles(friendly_id);