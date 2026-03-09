-- ==========================================
-- SEED PRODUCTION DATA & FEATURES (PART 2: DATA)
-- ==========================================
-- 2. CREATE PLATFORM FEATURES TABLE
CREATE TABLE IF NOT EXISTS platform_features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (
        category IN ('core', 'usage', 'support', 'integration')
    ),
    type TEXT CHECK (type IN ('boolean', 'limit')) DEFAULT 'boolean',
    default_value JSONB DEFAULT 'false'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;
-- Policies
DROP POLICY IF EXISTS "Public read access to features" ON platform_features;
CREATE POLICY "Public read access to features" ON platform_features FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage features" ON platform_features;
CREATE POLICY "Admins can manage features" ON platform_features FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);
-- 3. SEED FEATURES
INSERT INTO platform_features (
        id,
        name,
        description,
        category,
        type,
        default_value
    )
VALUES (
        'rfq_access',
        'Accès aux Devis (RFQ)',
        'Permet de faire des demandes de cotation',
        'core',
        'boolean',
        'true'::jsonb
    ),
    (
        'shipment_tracking',
        'Suivi des Expéditions',
        'Suivi en temps réel des cargaisons',
        'core',
        'boolean',
        'true'::jsonb
    ),
    (
        'api_access',
        'Accès API',
        'Accès programmatique aux données',
        'integration',
        'boolean',
        'false'::jsonb
    ),
    (
        'advanced_reports',
        'Rapports Avancés',
        'Statistiques détaillées et exports',
        'core',
        'boolean',
        'false'::jsonb
    ),
    (
        'max_users',
        'Utilisateurs Max',
        'Nombre maximum d''utilisateurs par compte',
        'usage',
        'limit',
        '1'::jsonb
    ),
    (
        'priority_support',
        'Support Prioritaire',
        'Traitement prioritaire des tickets',
        'support',
        'boolean',
        'false'::jsonb
    ),
    (
        'whitelabel',
        'Marque Blanche',
        'Personnalisation du tableau de bord',
        'core',
        'boolean',
        'false'::jsonb
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;
-- 4. SEED FEES (Real Data)
INSERT INTO fee_configs (
        name,
        type,
        value,
        category,
        target,
        is_recurring,
        description
    )
VALUES (
        'Commission sur Transaction',
        'percentage',
        5.0,
        'management',
        'forwarder',
        false,
        'Frais de plateforme sur chaque transaction validée'
    ),
    (
        'Assurance Standard',
        'percentage',
        1.5,
        'insurance',
        'client',
        false,
        'Couverture basique des marchandises'
    ),
    (
        'Assurance Tous Risques',
        'percentage',
        3.0,
        'insurance',
        'client',
        false,
        'Couverture complète incluant vol et casse'
    ),
    (
        'Frais de Dossier',
        'fixed',
        5000,
        'management',
        'client',
        false,
        'Frais administratifs par dossier'
    ),
    (
        'Frais de Magasinage',
        'fixed',
        2000,
        'storage',
        'client',
        true,
        'Appliqué par jour après franchise'
    ),
    (
        'Pénalité Retard Paiement',
        'percentage',
        10.0,
        'penalty',
        'client',
        false,
        'Sur facture impayée après échéance'
    ) ON CONFLICT DO NOTHING;
-- 5. SEED SUBSCRIPTION PLANS
-- Cleanup duplicates before adding unique constraint
DO $$ BEGIN -- Delete duplicates keeping the most recent one
DELETE FROM subscription_plans
WHERE id NOT IN (
        SELECT id
        FROM (
                SELECT DISTINCT ON (name) id
                FROM subscription_plans
                ORDER BY name,
                    created_at DESC
            ) s
    );
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_plans_name_key'
) THEN
ALTER TABLE subscription_plans
ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
END IF;
END $$;
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
        'Basique Mensuel',
        'Idéal pour démarrer',
        50000,
        'XOF',
        'monthly',
        '[{"name": "rfq_access", "value": true}, {"name": "shipment_tracking", "value": true}, {"name": "max_users", "value": 3}]'::jsonb,
        true
    ),
    (
        'Basique Trimestriel',
        'Idéal pour démarrer (3 mois)',
        150000,
        'XOF',
        'quarterly',
        '[{"name": "rfq_access", "value": true}, {"name": "shipment_tracking", "value": true}, {"name": "max_users", "value": 3}]'::jsonb,
        true
    ),
    (
        'Pro Mensuel',
        'Pour les entreprises en croissance',
        99900,
        'XOF',
        'monthly',
        '[{"name": "rfq_access", "value": true}, {"name": "advanced_reports", "value": true}, {"name": "max_users", "value": 10}, {"name": "priority_support", "value": true}]'::jsonb,
        true
    ),
    (
        'Pro Semestriel',
        'Pour les entreprises en croissance (6 mois)',
        599400,
        'XOF',
        'semiannual',
        '[{"name": "rfq_access", "value": true}, {"name": "advanced_reports", "value": true}, {"name": "max_users", "value": 10}, {"name": "priority_support", "value": true}]'::jsonb,
        true
    ),
    (
        'Entreprise Mensuel',
        'Solution complète pour grandes structures',
        199900,
        'XOF',
        'monthly',
        '[{"name": "rfq_access", "value": true}, {"name": "api_access", "value": true}, {"name": "whitelabel", "value": true}, {"name": "max_users", "value": 999}]'::jsonb,
        true
    ),
    (
        'Entreprise Annuel',
        'Solution complète (1 an)',
        2398800,
        'XOF',
        'yearly',
        '[{"name": "rfq_access", "value": true}, {"name": "api_access", "value": true}, {"name": "whitelabel", "value": true}, {"name": "max_users", "value": 999}]'::jsonb,
        true
    ) ON CONFLICT (name) DO
UPDATE
SET description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;