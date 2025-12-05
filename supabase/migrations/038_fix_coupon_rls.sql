-- ═══════════════════════════════════════════════════════════════
-- Fix: Allow Forwarders to Manage Their Own Coupons
-- ═══════════════════════════════════════════════════════════════
-- 0. Ensure 'scope' column exists (in case 037 was skipped)
DO $$ BEGIN -- Create ENUM type if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'coupon_scope'
) THEN CREATE TYPE coupon_scope AS ENUM ('platform', 'forwarder');
END IF;
-- Add column if not exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'coupons'
        AND column_name = 'scope'
) THEN
ALTER TABLE coupons
ADD COLUMN scope coupon_scope DEFAULT 'platform' NOT NULL;
END IF;
END $$;
-- 1. Policy for SELECT (View own coupons)
DROP POLICY IF EXISTS "Forwarders can view own coupons" ON coupons;
CREATE POLICY "Forwarders can view own coupons" ON coupons FOR
SELECT USING (created_by = auth.uid());
-- 2. Policy for INSERT (Create own coupons)
DROP POLICY IF EXISTS "Forwarders can create coupons" ON coupons;
CREATE POLICY "Forwarders can create coupons" ON coupons FOR
INSERT WITH CHECK (
        created_by = auth.uid()
        AND scope = 'forwarder' -- Enforce scope
    );
-- 3. Policy for UPDATE (Update own coupons)
DROP POLICY IF EXISTS "Forwarders can update own coupons" ON coupons;
CREATE POLICY "Forwarders can update own coupons" ON coupons FOR
UPDATE USING (created_by = auth.uid());
-- 4. Policy for DELETE (Delete own coupons)
DROP POLICY IF EXISTS "Forwarders can delete own coupons" ON coupons;
CREATE POLICY "Forwarders can delete own coupons" ON coupons FOR DELETE USING (created_by = auth.uid());