-- ==============================================================================
-- 🔴 FINAL SEED: LOYALTY TIERS
-- ==============================================================================
-- Insert the default 4 loyalty tiers safely
INSERT INTO public.loyalty_tiers (
        name,
        min_points,
        discount_percent,
        benefits,
        color_hex
    )
VALUES (
        'Bronze',
        0,
        0.00,
        '["Support standard"]',
        '#CD7F32'
    ),
    (
        'Silver',
        500,
        2.00,
        '["Support prioritaire","2% de remise"]',
        '#C0C0C0'
    ),
    (
        'Gold',
        2000,
        5.00,
        '["Support VIP","5% de remise","Assurance"]',
        '#FFD700'
    ),
    (
        'Elite',
        5000,
        10.00,
        '["Conciergerie dédiée","10% de remise"]',
        '#1a1a1a'
    ) ON CONFLICT (name) DO
UPDATE
SET min_points = EXCLUDED.min_points,
    discount_percent = EXCLUDED.discount_percent,
    benefits = EXCLUDED.benefits,
    color_hex = EXCLUDED.color_hex;