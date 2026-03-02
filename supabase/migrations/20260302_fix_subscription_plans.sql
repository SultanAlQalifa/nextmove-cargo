-- Update Subscription Plans with features and descriptions
UPDATE public.subscription_plans
SET description = 'Idéal pour les agences individuelles et débutants.',
    features = '[
        {"id": "s1", "name": "Gestion des RFQ (Basic)", "type": "boolean", "value": true, "included": true},
        {"id": "s2", "name": "5 offres actives simultanées", "type": "limit", "value": 5, "included": true},
        {"id": "s3", "name": "Support par email 48h", "type": "boolean", "value": true, "included": true},
        {"id": "s4", "name": "Accès au tableau de bord standard", "type": "boolean", "value": true, "included": true}
    ]'::jsonb
WHERE name = 'Starter';
UPDATE public.subscription_plans
SET description = 'Pour les agences en pleine croissance.',
    features = '[
        {"id": "p1", "name": "Gestion des RFQ (Avancée)", "type": "boolean", "value": true, "included": true},
        {"id": "p2", "name": "Offres illimitées", "type": "boolean", "value": true, "included": true},
        {"id": "p3", "name": "Support prioritaire 24h", "type": "boolean", "value": true, "included": true},
        {"id": "p4", "name": "Analytics de base", "type": "boolean", "value": true, "included": true},
        {"id": "p5", "name": "Visibilité accrue dans les recherches", "type": "boolean", "value": true, "included": true}
    ]'::jsonb
WHERE name = 'Pro';
UPDATE public.subscription_plans
SET description = 'Solution complète pour les grandes structures logistiques.',
    features = '[
        {"id": "e1", "name": "Tout ce qui est dans le plan Pro", "type": "boolean", "value": true, "included": true},
        {"id": "e2", "name": "Gestion Multi-pays", "type": "boolean", "value": true, "included": true},
        {"id": "e3", "name": "Accès API Développeur", "type": "boolean", "value": true, "included": true},
        {"id": "e4", "name": "Gestionnaire de compte dédié", "type": "boolean", "value": true, "included": true},
        {"id": "e5", "name": "Rapports d''activité personnalisés", "type": "boolean", "value": true, "included": true}
    ]'::jsonb
WHERE name = 'Enterprise';