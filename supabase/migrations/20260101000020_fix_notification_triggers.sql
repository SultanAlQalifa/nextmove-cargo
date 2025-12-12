-- Fix Notification Permissions (RLS Violation)
-- Triggers were failing because users cannot insert notifications for OTHER users.
-- We must make the trigger functions SECURITY DEFINER to bypass RLS.
BEGIN;
-- 1. Notify Forwarders on New RFQ
CREATE OR REPLACE FUNCTION notify_new_rfq() RETURNS TRIGGER AS $$
DECLARE forwarder_record RECORD;
BEGIN -- Si la RFQ est publiée
IF NEW.status = 'published'
AND (
    OLD.status IS NULL
    OR OLD.status = 'draft'
) THEN -- Cas 1: RFQ ciblée vers un transitaire spécifique
IF NEW.specific_forwarder_id IS NOT NULL THEN
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
        NEW.specific_forwarder_id,
        'Nouvelle demande de devis reçue',
        'Un client vous a envoyé une demande de cotation spécifique.',
        'rfq_new',
        '/dashboard/forwarder/rfq/' || NEW.id
    );
-- Cas 2: RFQ publique -> Notifier tous les transitaires
ELSE FOR forwarder_record IN
SELECT id
FROM profiles
WHERE role = 'forwarder'
LIMIT 50 LOOP
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
        forwarder_record.id,
        'Nouvelle opportunité disponible',
        'Une nouvelle demande de devis correspond à vos critères.',
        'rfq_new',
        '/dashboard/forwarder/rfq/available'
    );
END LOOP;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Added SECURITY DEFINER
-- 2. Notify Client on New Offer
CREATE OR REPLACE FUNCTION notify_new_offer() RETURNS TRIGGER AS $$
DECLARE client_id UUID;
rfq_ref VARCHAR;
BEGIN -- Récupérer l'ID du client propriétaire de la RFQ
SELECT r.client_id,
    r.origin_port || ' -> ' || r.destination_port INTO client_id,
    rfq_ref
FROM rfq_requests r
WHERE r.id = NEW.rfq_id;
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
        client_id,
        'Nouvelle offre reçue',
        'Un transitaire a répondu à votre demande : ' || rfq_ref,
        'offer_new',
        '/dashboard/client/rfq/' || NEW.rfq_id
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Added SECURITY DEFINER
-- 3. Notify Forwarder on Offer Status Change
CREATE OR REPLACE FUNCTION notify_offer_status() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'accepted'
    AND OLD.status != 'accepted' THEN
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
        NEW.forwarder_id,
        'Offre Acceptée ! 🎉',
        'Félicitations ! Votre offre a été retenue par le client.',
        'offer_accepted',
        '/dashboard/forwarder/offers'
    );
ELSIF NEW.status = 'rejected'
AND OLD.status != 'rejected' THEN
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
        NEW.forwarder_id,
        'Offre non retenue',
        'Votre offre n''a malheureusement pas été retenue pour cette expédition.',
        'offer_rejected',
        '/dashboard/forwarder/offers'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Added SECURITY DEFINER
COMMIT;