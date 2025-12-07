-- ═══════════════════════════════════════════════════════════════
-- Fix: Ensure Coupons Table Exists
-- ═══════════════════════════════════════════════════════════════
-- Create ENUM if not exists
DO $$ BEGIN CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_discount CHECK (discount_value > 0),
    CONSTRAINT valid_dates CHECK (
        end_date IS NULL
        OR end_date > start_date
    )
);
-- Create coupon_usages table if not exists
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_usage_per_shipment UNIQUE(coupon_id, shipment_id)
);
-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
-- Re-apply policies (drop first to avoid errors)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons" ON coupons FOR
SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
DROP POLICY IF EXISTS "Users can view own coupon usage" ON coupon_usages;
CREATE POLICY "Users can view own coupon usage" ON coupon_usages FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own coupon usage" ON coupon_usages;
CREATE POLICY "Users can insert own coupon usage" ON coupon_usages FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Create or replace function for usage increment
CREATE OR REPLACE FUNCTION increment_coupon_usage() RETURNS TRIGGER AS $$ BEGIN
UPDATE coupons
SET usage_count = usage_count + 1
WHERE id = NEW.coupon_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_coupon_used ON coupon_usages;
CREATE TRIGGER on_coupon_used
AFTER
INSERT ON coupon_usages FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();