-- Add rating column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0 CHECK (
        rating >= 0
        AND rating <= 5
    );
-- Ensure company_name exists too (just in case)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
-- Comment
COMMENT ON COLUMN profiles.rating IS 'Average rating of the profile (e.g. Forwarder rating)';