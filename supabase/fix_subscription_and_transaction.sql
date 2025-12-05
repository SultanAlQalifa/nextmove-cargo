-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE CORRECTION: ABONNEMENT ET TRANSACTION (Afriflux)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE v_user_id UUID;
v_plan_id UUID;
v_plan_price DECIMAL;
v_plan_currency TEXT;
v_plan_name TEXT;
BEGIN -- 1. Récupérer l'ID de l'utilisateur Afriflux
SELECT id INTO v_user_id
FROM profiles
WHERE email = 'afriflux@gmail.com';
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilisateur afriflux@gmail.com non trouvé.';
END IF;
-- 2. Récupérer le "premier" plan (le moins cher)
SELECT id,
    price,
    currency,
    name INTO v_plan_id,
    v_plan_price,
    v_plan_currency,
    v_plan_name
FROM subscription_plans
ORDER BY price ASC
LIMIT 1;
IF v_plan_id IS NULL THEN RAISE EXCEPTION 'Aucun plan d''abonnement trouvé dans la base.';
END IF;
RAISE NOTICE 'Plan trouvé : % (% %)',
v_plan_name,
v_plan_price,
v_plan_currency;
-- 3. Créer ou Mettre à jour l'abonnement dans user_subscriptions
-- On supprime d'abord s'il y en a un vieux pour être propre
DELETE FROM user_subscriptions
WHERE user_id = v_user_id;
INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        start_date,
        end_date,
        auto_renew
    )
VALUES (
        v_user_id,
        v_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '1 month',
        -- On suppose mensuel par défaut
        TRUE
    );
-- 4. Corriger la transaction existante (ou la créer si absente)
-- On supprime l'ancienne transaction de régularisation pour en refaire une propre
DELETE FROM transactions
WHERE user_id = v_user_id
    AND (
        metadata->>'note' = 'Régularisation'
        OR metadata->>'note' = 'Régularisation transaction manquante'
    );
INSERT INTO transactions (
        user_id,
        amount,
        currency,
        status,
        method,
        reference,
        metadata,
        created_at
    )
VALUES (
        v_user_id,
        v_plan_price,
        v_plan_currency,
        'completed',
        'card',
        'REGUL-' || floor(
            extract(
                epoch
                from now()
            )
        )::text,
        jsonb_build_object(
            'type',
            'subscription',
            'plan_name',
            v_plan_name,
            'note',
            'Régularisation (Correction Montant)'
        ),
        NOW()
    );
RAISE NOTICE 'Tout est corrigé : Abonnement actif sur % et Transaction de % % créée.',
v_plan_name,
v_plan_price,
v_plan_currency;
END $$;