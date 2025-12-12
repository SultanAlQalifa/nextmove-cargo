-- Add website_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website_url TEXT;
-- Comment on column
COMMENT ON COLUMN profiles.website_url IS 'External website URL for the user (specifically forwarders)';