-- Ensure review_count column exists on profiles table
-- This serves as a fix for cases where the previous migration might have been skipped or partially applied
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;