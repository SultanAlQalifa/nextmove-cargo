-- Fix: Adding search_path to functions to resolve Supabase linter warnings (0011_function_search_path_mutable)
-- Date: 2026-02-28
-- 1. update_user_loyalty_tier
-- Drop trigger first to avoid dependency errors during function drop
DROP TRIGGER IF EXISTS tr_update_loyalty_tier ON public.profiles;
DROP FUNCTION IF EXISTS public.update_user_loyalty_tier();
CREATE OR REPLACE FUNCTION public.update_user_loyalty_tier() RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public,
    pg_temp AS $$ BEGIN
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
$$;
-- Ensure trigger exists
CREATE TRIGGER tr_update_loyalty_tier
AFTER
UPDATE OF loyalty_points ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_user_loyalty_tier();
-- 2. calculate_shipping_quote
DROP FUNCTION IF EXISTS public.calculate_shipping_quote(
    UUID,
    UUID,
    TEXT,
    TEXT,
    NUMERIC,
    NUMERIC,
    UUID,
    TEXT []
);
CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(
        p_origin_id uuid,
        p_dest_id uuid,
        p_mode text,
        p_type text,
        p_weight numeric,
        p_volume numeric,
        p_user_id uuid DEFAULT NULL,
        p_additional_services text [] DEFAULT ARRAY []::text []
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
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
$$;
-- 3. check_rate_limit
DROP FUNCTION IF EXISTS public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        p_user_id UUID,
        p_action TEXT,
        p_limit INTEGER,
        p_window_seconds INTEGER
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
DECLARE v_key TEXT;
v_count INTEGER;
BEGIN -- 1. Constuire la clé unique COMBINANT l'action et l'ID de l'utilisateur
v_key := p_action || '_' || p_user_id::text;
-- 2. Insérer ou mettre à jour la ligne avec TOUTES les colonnes
INSERT INTO public.rate_limits (
        key,
        user_id,
        action,
        window_start,
        request_count,
        last_refill,
        tokens,
        created_at
    )
VALUES (
        v_key,
        p_user_id,
        p_action,
        NOW(),
        1,
        NOW(),
        1,
        NOW()
    ) ON CONFLICT (key) DO
UPDATE
SET window_start = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    request_count = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END,
    last_refill = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    tokens = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END
RETURNING request_count INTO v_count;
-- 3. Valider la limite
IF v_count > p_limit THEN RETURN FALSE;
ELSE RETURN TRUE;
END IF;
END;
$$;
-- 4. check_wallet_update_permission
-- Drop triggers first to avoid dependency errors during function drop
DROP TRIGGER IF EXISTS tr_check_wallet_update ON public.wallets;
DROP TRIGGER IF EXISTS tr_lock_wallet_balance ON public.wallets;
DROP FUNCTION IF EXISTS public.check_wallet_update_permission();
CREATE OR REPLACE FUNCTION public.check_wallet_update_permission() RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public,
    pg_temp AS $$ BEGIN -- Only allow update if it's coming from an internal system call (SECURITY DEFINER)
    -- or if the user is an admin making a manual adjustment.
    IF (
        select current_setting('role')
    ) != 'service_role'
    AND NOT public.is_admin() THEN -- Allow ONLY if we can prove it's an authorized internal function.
    -- Since we use SECURITY DEFINER for system functions, they run as the owner (usually postgres).
    IF session_user = 'postgres' THEN RETURN NEW;
END IF;
RAISE EXCEPTION 'Direct wallet updates are forbidden for security reasons.';
END IF;
RETURN NEW;
END;
$$;
-- Ensure trigger exists
CREATE TRIGGER tr_check_wallet_update BEFORE
UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.check_wallet_update_permission();
-- 5. accept_rfq_offer
DROP FUNCTION IF EXISTS public.accept_rfq_offer(UUID);
CREATE OR REPLACE FUNCTION public.accept_rfq_offer(p_offer_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
DECLARE v_offer RECORD;
v_rfq RECORD;
v_client RECORD;
v_forwarder RECORD;
v_plan_name TEXT;
v_discount NUMERIC := 0;
v_final_price INTEGER;
v_tracking_number TEXT;
v_departure_date TIMESTAMP;
v_arrival_date TIMESTAMP;
v_shipment_id UUID;
v_client_email TEXT;
v_forwarder_email TEXT;
v_forwarder_company TEXT;
BEGIN -- 1. Fetch Offer & RFQ details with locks
SELECT o.*,
    r.client_id,
    r.origin_port,
    r.destination_port,
    r.cargo_type,
    r.weight_kg,
    r.volume_cbm,
    r.quantity,
    r.transport_mode,
    r.service_type,
    r.origin_country,
    r.destination_country INTO v_offer
FROM rfq_offers o
    JOIN rfq_requests r ON o.rfq_id = r.id
WHERE o.id = p_offer_id FOR
UPDATE OF o;
IF NOT FOUND THEN RAISE EXCEPTION 'Offer not found';
END IF;
IF v_offer.status != 'pending' THEN RAISE EXCEPTION 'Offer is not in pending status';
END IF;
-- 2. Verify Authorization (caller must be the RFQ client)
IF v_offer.client_id != (
    select auth.uid()
) THEN -- Allow if caller is service_role (handled by SECURITY DEFINER if called from backend)
-- But for RPC called from frontend, we check (select auth.uid())
IF (
    select auth.role()
) != 'service_role' THEN RAISE EXCEPTION 'Not authorized to accept this offer';
END IF;
END IF;
-- 3. Calculate Discount from Subscription
SELECT sp.name INTO v_plan_name
FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = v_offer.client_id
    AND us.status = 'active'
ORDER BY us.created_at DESC
LIMIT 1;
v_plan_name := lower(COALESCE(v_plan_name, ''));
IF v_plan_name LIKE '%elite%'
OR v_plan_name LIKE '%enterprise%' THEN v_discount := 0.10;
ELSIF v_plan_name LIKE '%pro%' THEN v_discount := 0.05;
END IF;
v_final_price := floor(v_offer.total_price * (1 - v_discount));
-- 4. Set Statuses
UPDATE rfq_offers
SET status = 'accepted',
    accepted_at = now()
WHERE id = p_offer_id;
UPDATE rfq_requests
SET status = 'offer_accepted'
WHERE id = v_offer.rfq_id;
-- Reject other pending offers
UPDATE rfq_offers
SET status = 'rejected',
    rejected_at = now(),
    rejected_reason = 'Une autre offre a été acceptée (Backend Automation)'
WHERE rfq_id = v_offer.rfq_id
    AND id != p_offer_id
    AND status = 'pending';
-- 5. Create Shipment
v_tracking_number := 'SHP-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 1000)::text, 3, '0');
v_departure_date := COALESCE(
    v_offer.departure_date,
    (now() + interval '3 days')
);
v_arrival_date := v_departure_date + (
    COALESCE(v_offer.estimated_transit_days, 30) * interval '1 day'
);
INSERT INTO shipments (
        tracking_number,
        rfq_id,
        client_id,
        forwarder_id,
        status,
        origin_port,
        origin_country,
        destination_port,
        destination_country,
        cargo_type,
        cargo_weight,
        cargo_volume,
        cargo_packages,
        transport_mode,
        transport_type,
        service_type,
        price,
        currency,
        departure_date,
        arrival_estimated_date
    )
VALUES (
        v_tracking_number,
        v_offer.rfq_id,
        v_offer.client_id,
        v_offer.forwarder_id,
        'pending_payment',
        v_offer.origin_port,
        COALESCE(v_offer.origin_country, 'XX'),
        v_offer.destination_port,
        COALESCE(v_offer.destination_country, 'XX'),
        v_offer.cargo_type,
        COALESCE(v_offer.weight_kg, 0),
        COALESCE(v_offer.volume_cbm, 0),
        COALESCE(v_offer.quantity, 1),
        v_offer.transport_mode,
        v_offer.transport_mode,
        v_offer.service_type,
        v_final_price,
        v_offer.currency,
        v_departure_date,
        v_arrival_date
    )
RETURNING id INTO v_shipment_id;
-- 6. Queue Emails (Resolve profiles)
SELECT email INTO v_client_email
FROM profiles
WHERE id = v_offer.client_id;
SELECT email,
    company_name INTO v_forwarder_email,
    v_forwarder_company
FROM profiles
WHERE id = v_offer.forwarder_id;
IF v_client_email IS NOT NULL THEN
INSERT INTO email_queue (
        subject,
        body,
        recipient_group,
        recipient_emails,
        status
    )
VALUES (
        'Confirmation d''Acceptation de l''Offre - RFQ ' || substring(
            v_offer.rfq_id::text
            from 1 for 8
        ),
        '<h2>Offre Acceptée !</h2><p>Vous avez accepté l''offre de transport de <strong>' || COALESCE(v_forwarder_company, 'votre prestataire') || '</strong>.</p>' || '<ul><li>Numéro de Suivi : <strong>' || v_tracking_number || '</strong></li><li>Montant : ' || v_final_price || ' ' || v_offer.currency || '</li></ul>',
        'specific',
        ARRAY [v_client_email],
        'pending'
    );
END IF;
IF v_forwarder_email IS NOT NULL THEN
INSERT INTO email_queue (
        subject,
        body,
        recipient_group,
        recipient_emails,
        status
    )
VALUES (
        'Nouveau Contrat Remporté - RFQ ' || substring(
            v_offer.rfq_id::text
            from 1 for 8
        ),
        '<h2>Félicitations !</h2><p>Votre offre a été retenue pour la demande de cotation.</p>' || '<p>Un nouveau dossier d''expédition a été généré : <strong>' || v_tracking_number || '</strong>.</p>',
        'specific',
        ARRAY [v_forwarder_email],
        'pending'
    );
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'shipment_id',
    v_shipment_id,
    'tracking_number',
    v_tracking_number,
    'final_price',
    v_final_price
);
END;
$$;
-- 6. check_kyc_required
DROP FUNCTION IF EXISTS public.check_kyc_required(UUID, NUMERIC);
CREATE OR REPLACE FUNCTION public.check_kyc_required(p_user_id uuid, p_pending_amount numeric) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
DECLARE v_kyc_status text;
v_monthly_volume numeric;
v_limit numeric := 500000;
-- Limite de 500,000 XOF par mois
BEGIN -- 1. Récupérer le statut KYC et le rôle
SELECT kyc_status INTO v_kyc_status
FROM public.profiles
WHERE id = p_user_id;
-- 2. Si déjà vérifié, pas besoin de KYC
IF v_kyc_status = 'verified' THEN RETURN false;
END IF;
-- 3. Calculer le volume mensuel
v_monthly_volume := public.get_monthly_transaction_volume(p_user_id);
-- 4. Vérifier si le nouveau montant dépasse la limite
IF (v_monthly_volume + p_pending_amount) > v_limit THEN RETURN true;
END IF;
RETURN false;
END;
$$;
-- 7. get_monthly_transaction_volume
DROP FUNCTION IF EXISTS public.get_monthly_transaction_volume(UUID);
CREATE OR REPLACE FUNCTION public.get_monthly_transaction_volume(p_user_id uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
DECLARE v_total numeric;
BEGIN
SELECT COALESCE(SUM(t.amount), 0) INTO v_total
FROM public.transactions t
    JOIN public.wallets w ON t.wallet_id = w.id
WHERE w.user_id = p_user_id
    AND t.type = 'payment'
    AND t.status = 'completed'
    AND t.created_at >= date_trunc('month', now());
RETURN v_total;
END;
$$;
-- 8. get_plan_limit
DROP FUNCTION IF EXISTS public.get_plan_limit(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.get_plan_limit(p_user_id UUID, p_feature_key TEXT) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
DECLARE v_role TEXT;
v_plan_name TEXT;
BEGIN -- 1. Identify User Role (Clients & Admins are exempt)
SELECT role INTO v_role
FROM profiles
WHERE id = p_user_id;
IF v_role IN ('client', 'admin', 'super-admin') THEN RETURN 9999;
END IF;
-- 2. For Forwarders, check active subscription
SELECT sp.name INTO v_plan_name
FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = p_user_id
    AND us.status = 'active'
LIMIT 1;
-- 3. Map Plan Name to Limits
IF v_plan_name ILIKE '%Starter%' THEN IF p_feature_key = 'rfq_monthly_limit' THEN RETURN 3;
END IF;
IF p_feature_key = 'shipment_monthly_limit' THEN RETURN 5;
END IF;
ELSIF v_plan_name ILIKE '%Pro%' THEN RETURN 9999;
-- Unlimited for Pro
ELSIF v_plan_name IS NOT NULL THEN -- Elite / Enterprise
RETURN 99999;
-- Unlimited
END IF;
-- 4. Default for Forwarders without active plan
RETURN 0;
END;
$$;