-- 1. Ensure Unique Constraint and Update Subscription Plans
DO $$
DECLARE r RECORD;
BEGIN -- 1. Consolidate foreign key references in user_subscriptions
-- For each duplicated name/cycle, we find the "keeper" (lowest ID)
-- and update all subscriptions to point to it.
FOR r IN (
    SELECT name,
        billing_cycle,
        MIN(id::text)::uuid as keeper_id
    FROM public.subscription_plans
    GROUP BY name,
        billing_cycle
    HAVING COUNT(*) > 1
) LOOP
UPDATE public.user_subscriptions
SET plan_id = r.keeper_id
WHERE plan_id IN (
        SELECT id
        FROM public.subscription_plans
        WHERE name = r.name
            AND billing_cycle = r.billing_cycle
            AND id <> r.keeper_id
    );
END LOOP;
-- 2. Cleanup now-unreferenced duplicates
DELETE FROM public.subscription_plans sp1
WHERE EXISTS (
        SELECT 1
        FROM public.subscription_plans sp2
        WHERE sp1.name = sp2.name
            AND sp1.billing_cycle = sp2.billing_cycle
            AND sp1.id > sp2.id
    );
-- 3. Add unique constraint if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_plans_name_billing_cycle_key'
) THEN
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_name_billing_cycle_key UNIQUE (name, billing_cycle);
END IF;
END $$;
-- Reset/Update plans to ensure source of truth
INSERT INTO subscription_plans (
        name,
        description,
        price,
        currency,
        billing_cycle,
        features,
        is_active
    )
VALUES (
        'Starter',
        'Pour démarrer votre activité',
        15000,
        'XOF',
        'monthly',
        '["Accès aux demandes de cotation", "Gestion de profil basique", "Support email"]',
        true
    ),
    (
        'Starter Annuel',
        'Economisez 2 mois !',
        150000,
        'XOF',
        'yearly',
        '["Accès aux demandes de cotation", "Gestion de profil basique", "Support email"]',
        true
    ),
    (
        'Pro',
        'Pour les transitaires en croissance',
        45000,
        'XOF',
        'monthly',
        '["Toutes les fonctionnalités Starter", "Priorité sur les offres", "Badge Vérifié", "Support prioritaire"]',
        true
    ),
    (
        'Pro Annuel',
        'Economisez 2 mois !',
        450000,
        'XOF',
        'yearly',
        '["Toutes les fonctionnalités Starter", "Priorité sur les offres", "Badge Vérifié", "Support prioritaire"]',
        true
    ),
    (
        'Elite',
        'Pour les grands volumes',
        90000,
        'XOF',
        'monthly',
        '["Tout inclus", "Accès API", "Gestionnaire de compte dédié", "Badge Elite"]',
        true
    ),
    (
        'Elite Annuel',
        'Economisez 2 mois !',
        900000,
        'XOF',
        'yearly',
        '["Tout inclus", "Accès API", "Gestionnaire de compte dédié", "Badge Elite"]',
        true
    ) ON CONFLICT (name, billing_cycle) DO
UPDATE
SET description = EXCLUDED.description,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
-- 2 Ensure Loyalty Points column exists (Idempotent)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
-- 3. Add Tier function (Optional, can be logic in app)
CREATE OR REPLACE FUNCTION calculate_tier() RETURNS TRIGGER AS $$ BEGIN IF NEW.loyalty_points >= 5000 THEN NEW.tier := 'Gold';
ELSIF NEW.loyalty_points >= 2000 THEN NEW.tier := 'Silver';
ELSE NEW.tier := 'Bronze';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_calculate_tier ON profiles;
CREATE TRIGGER tr_calculate_tier BEFORE
UPDATE OF loyalty_points ON profiles FOR EACH ROW EXECUTE FUNCTION calculate_tier();