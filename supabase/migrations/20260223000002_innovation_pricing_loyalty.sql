-- Migration: Loyalty Tiers & Pricing Engine
-- Description: Implements a tier-based loyalty system and a server-side pricing engine.
-- 1. LOYALTY TIERS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    -- 'Bronze', 'Silver', 'Gold', 'Elite'
    min_points integer NOT NULL DEFAULT 0,
    discount_percent numeric(5, 2) DEFAULT 0.00,
    benefits jsonb DEFAULT '[]',
    color_hex text,
    created_at timestamptz DEFAULT now()
);
-- Seed initial tiers
INSERT INTO public.loyalty_tiers (
        name,
        min_points,
        discount_percent,
        color_hex,
        benefits
    )
VALUES (
        'Bronze',
        0,
        0.00,
        '#CD7F32',
        '["Support standard"]'
    ),
    (
        'Silver',
        500,
        2.00,
        '#C0C0C0',
        '["Support prioritaire", "2% de remise"]'
    ),
    (
        'Gold',
        2000,
        5.00,
        '#FFD700',
        '["Support VIP", "5% de remise", "Assurance offerte sur 1 voyage"]'
    ),
    (
        'Elite',
        5000,
        10.00,
        '#1a1a1a',
        '["Conciergerie dédiée", "10% de remise", "Accès aux événements exclusifs"]'
    ) ON CONFLICT (name) DO
UPDATE
SET min_points = EXCLUDED.min_points,
    discount_percent = EXCLUDED.discount_percent,
    color_hex = EXCLUDED.color_hex;
-- 2. ADD TIER_ID TO PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS loyalty_tier_id uuid REFERENCES public.loyalty_tiers(id);
-- Trigger to update tier based on points
CREATE OR REPLACE FUNCTION public.update_user_loyalty_tier() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.profiles p
SET loyalty_tier_id = (
        SELECT id
        FROM public.loyalty_tiers
        WHERE min_points <= p.loyalty_points
        ORDER BY min_points DESC
        LIMIT 1
    )
WHERE p.id = NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_update_loyalty_tier ON public.profiles;
CREATE TRIGGER tr_update_loyalty_tier
AFTER
UPDATE OF loyalty_points ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_user_loyalty_tier();
-- 3. UNIFIED PRICING ENGINE FUNCTION
CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(
        p_origin_id uuid,
        p_dest_id uuid,
        p_mode text,
        -- 'air', 'sea'
        p_type text,
        -- 'standard', 'express'
        p_weight numeric,
        p_volume numeric,
        p_user_id uuid DEFAULT NULL,
        p_additional_services text [] DEFAULT ARRAY []::text []
    ) RETURNS jsonb AS $$
DECLARE v_base_price numeric;
v_unit text;
v_quantity numeric;
v_discount_percent numeric := 0;
v_base_cost numeric;
v_insurance_cost numeric := 0;
v_tax_cost numeric := 0;
v_other_services_cost numeric := 0;
v_total_cost numeric;
v_tier_name text;
BEGIN -- 1. Identify User Tier & Discount
IF p_user_id IS NOT NULL THEN
SELECT t.discount_percent,
    t.name INTO v_discount_percent,
    v_tier_name
FROM public.profiles p
    JOIN public.loyalty_tiers t ON p.loyalty_tier_id = t.id
WHERE p.id = p_user_id;
END IF;
-- 2. Fetch Base Rate (Platform Rate as baseline)
SELECT price,
    unit INTO v_base_price,
    v_unit
FROM public.platform_rates
WHERE mode = p_mode
    AND type = p_type
    AND is_global = true
LIMIT 1;
IF v_base_price IS NULL THEN RETURN jsonb_build_object('error', 'Rate not found for this combination');
END IF;
-- 3. Rule Dispatch: Air (KG) vs Sea (CBM)
IF p_mode = 'air' THEN v_quantity := p_weight;
ELSE v_quantity := p_volume;
END IF;
v_base_cost := v_base_price * v_quantity;
-- 4. Apply Loyalty Discount to Base Cost
v_base_cost := v_base_cost * (1 - (COALESCE(v_discount_percent, 0) / 100));
-- 5. Calculate Additional Services (Simplified for RPC)
-- In a full implementation, we would query fee_configs for each element in p_additional_services
-- For now, let's look at common services
IF 'insurance' = ANY(p_additional_services) THEN v_insurance_cost := v_base_cost * 0.01;
-- Demo: 1%
END IF;
IF 'priority' = ANY(p_additional_services) THEN v_other_services_cost := v_other_services_cost + (v_base_cost * 0.05);
-- Demo: 5%
END IF;
-- 6. Tax (Standard 18% or from fee_configs)
v_tax_cost := (
    v_base_cost + v_insurance_cost + v_other_services_cost
) * 0.18;
v_total_cost := v_base_cost + v_insurance_cost + v_other_services_cost + v_tax_cost;
RETURN jsonb_build_object(
    'base_cost',
    v_base_cost,
    'quantity',
    v_quantity,
    'unit',
    v_unit,
    'discount_applied',
    v_discount_percent,
    'tier_name',
    v_tier_name,
    'insurance_cost',
    v_insurance_cost,
    'tax_cost',
    v_tax_cost,
    'other_services_cost',
    v_other_services_cost,
    'total_cost',
    v_total_cost,
    'currency',
    'XOF'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;