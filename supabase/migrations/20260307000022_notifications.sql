-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Notification System
-- Phase 2: Real-time Alerts
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
DO $$ BEGIN CREATE TYPE notification_type AS ENUM (
    'rfq_new',
    'offer_new',
    'offer_accepted',
    'offer_rejected',
    'system_info'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- ═══ TABLE: notifications ═══
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    link VARCHAR(255),
    -- Lien de redirection (ex: /dashboard/client/rfq/123)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);
-- ═══ RLS POLICIES ═══
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (
        (
            select auth.uid()
        ) = user_id
    );
-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (
        (
            select auth.uid()
        ) = user_id
    );
-- ═══ FUNCTIONS & TRIGGERS ═══
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
-- Cas 2: RFQ publique -> Notifier tous les transitaires (Attention: peut être lourd si bcp de users)
-- Pour l'instant on limite aux 50 premiers pour éviter le spam massif en démo
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
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_rfq_published ON rfq_requests;
CREATE TRIGGER on_rfq_published
AFTER
INSERT
    OR
UPDATE ON rfq_requests FOR EACH ROW EXECUTE FUNCTION notify_new_rfq();
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
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_offer_created ON rfq_offers;
CREATE TRIGGER on_offer_created
AFTER
INSERT ON rfq_offers FOR EACH ROW EXECUTE FUNCTION notify_new_offer();
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
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_offer_status_change ON rfq_offers;
CREATE TRIGGER on_offer_status_change
AFTER
UPDATE ON rfq_offers FOR EACH ROW EXECUTE FUNCTION notify_offer_status();