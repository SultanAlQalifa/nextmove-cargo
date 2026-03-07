-- Migration: Global Refactor - Backend Logic for Offer Acceptance
-- Description: Moves critical business logic for RFQ offer acceptance from client to server.
CREATE OR REPLACE FUNCTION accept_rfq_offer(p_offer_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
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
IF v_offer.client_id != (select auth.uid()) THEN -- Allow if caller is service_role (handled by SECURITY DEFINER if called from backend)
-- But for RPC called from frontend, we check (select auth.uid())
IF (select auth.role()) != 'service_role' THEN RAISE EXCEPTION 'Not authorized to accept this offer';
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