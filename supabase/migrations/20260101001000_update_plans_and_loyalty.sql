-- 1. Update Subscription Plans
DELETE FROM subscription_plans;
-- Reset plans to ensure clean slate (safe for dev/staging, careful in prod if real subs exist but user asked for replacement)
INSERT INTO subscription_plans (
        name,
        description,
        price,
        currency,
        billing_cycle,
        features,
        is_active
    )
VALUES -- Starter Plan
    (
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
    -- Pro Plan (Most Popular)
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
    -- Enterprise Plan
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
    );
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