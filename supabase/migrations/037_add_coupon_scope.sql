-- ═══════════════════════════════════════════════════════════════
-- Fix: Add Scope to Coupons
-- ═══════════════════════════════════════════════════════════════
-- Create ENUM if not exists
DO $$ BEGIN CREATE TYPE coupon_scope AS ENUM ('platform', 'forwarder');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Add scope column
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS scope coupon_scope DEFAULT 'platform';
-- Update RLS policies to enforce scope visibility
-- Admins check platform coupons
-- Forwarders check their own coupons
-- Users check whatever they are trying to apply (handled by application logic, but reading needs to be open for validation)
-- Ensure existing coupons are platform (safe default)
UPDATE coupons
SET scope = 'platform'
WHERE scope IS NULL;