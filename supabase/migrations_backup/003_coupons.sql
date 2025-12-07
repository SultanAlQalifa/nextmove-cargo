-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Coupon System
-- Phase 3: Discounts & Promotions
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
CREATE TYPE discount_type AS ENUM (
    'percentage',
    -- Pourcentage (ex: 10%)
    'fixed_amount' -- Montant fixe (ex: 5000 XOF)
);
-- ═══ TABLE: coupons ═══
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    -- Montant minimum pour appliquer
    max_discount_amount DECIMAL(10, 2),
    -- Plafond de réduction (pour %)
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    -- Nombre max d'utilisations totales
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
-- ═══ TABLE: coupon_usages ═══
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    -- Optionnel si utilisé hors expédition
    discount_amount DECIMAL(10, 2) NOT NULL,
    -- Montant économisé
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_usage_per_shipment UNIQUE(coupon_id, shipment_id)
);
-- ═══ INDEXES ═══
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);
-- ═══ RLS POLICIES ═══
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
-- Tout le monde peut lire les coupons actifs (pour validation)
-- Note: On pourrait restreindre, mais pour l'instant on laisse ouvert pour simplifier la validation client
CREATE POLICY "Anyone can view active coupons" ON coupons FOR
SELECT USING (is_active = true);
-- Admins peuvent tout faire sur les coupons
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Clients peuvent voir leurs propres usages
CREATE POLICY "Users can view own coupon usage" ON coupon_usages FOR
SELECT USING (auth.uid() = user_id);
-- Système peut insérer des usages (via trigger ou service role, ici on permet aux auth users pour le MVP)
CREATE POLICY "Users can insert own coupon usage" ON coupon_usages FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- ═══ TRIGGERS ═══
-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE
UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Fonction pour incrémenter le compteur d'usage
CREATE OR REPLACE FUNCTION increment_coupon_usage() RETURNS TRIGGER AS $$ BEGIN
UPDATE coupons
SET usage_count = usage_count + 1
WHERE id = NEW.coupon_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_coupon_used
AFTER
INSERT ON coupon_usages FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();