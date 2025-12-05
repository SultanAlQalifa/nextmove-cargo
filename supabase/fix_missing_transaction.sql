-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE RÉGULARISATION TRANSACTION (Afriflux)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE v_user_id UUID;
v_plan_price DECIMAL;
v_plan_currency TEXT;
v_plan_name TEXT;
BEGIN -- 1. Récupérer l'ID de l'utilisateur Afriflux
SELECT id INTO v_user_id
FROM profiles
WHERE email = 'afriflux@gmail.com';
IF v_user_id IS NULL THEN RAISE NOTICE 'Utilisateur afriflux@gmail.com non trouvé.';
RETURN;
END IF;
-- 2. Récupérer le prix du plan auquel il est abonné
SELECT p.price,
    p.currency,
    p.name INTO v_plan_price,
    v_plan_currency,
    v_plan_name
FROM user_subscriptions us
    JOIN subscription_plans p ON us.plan_id = p.id
WHERE us.user_id = v_user_id
    AND us.status = 'active'
LIMIT 1;
-- Si pas de plan trouvé (cas rare si on vient de le forcer), on met des valeurs par défaut
IF v_plan_price IS NULL THEN v_plan_price := 50000;
-- Valeur par défaut
v_plan_currency := 'XOF';
v_plan_name := 'Plan Standard (Regularisation)';
END IF;
-- 3. Créer la transaction manquante
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
        -- On suppose un paiement carte/système
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
            'Régularisation transaction manquante'
        ),
        NOW() -- Date d'aujourd'hui
    );
RAISE NOTICE 'Transaction de régularisation créée pour % : % %',
v_plan_name,
v_plan_price,
v_plan_currency;
END $$;