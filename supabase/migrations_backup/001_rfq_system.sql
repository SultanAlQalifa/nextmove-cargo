-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - RFQ System Database Schema
-- Phase 1: Request for Quote (Demandes de Devis)
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
-- Statut des demandes RFQ
CREATE TYPE rfq_status AS ENUM (
    'draft',
    -- Brouillon (non publié)
    'published',
    -- Publié (visible aux transitaires)
    'offers_received',
    -- Offres reçues
    'offer_accepted',
    -- Offre acceptée (→ création expédition)
    'expired',
    -- Expiré
    'cancelled' -- Annulé par le client
);
-- Mode de transport (déjà existant, mais on le recrée si nécessaire)
DO $$ BEGIN CREATE TYPE transport_mode AS ENUM ('sea', 'air');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Type de service (déjà existant, mais on le recrée si nécessaire)
DO $$ BEGIN CREATE TYPE service_type AS ENUM ('standard', 'express');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Statut des offres
CREATE TYPE offer_status AS ENUM (
    'pending',
    -- En attente de réponse client
    'accepted',
    -- Acceptée par le client
    'rejected',
    -- Rejetée par le client
    'withdrawn',
    -- Retirée par le transitaire
    'expired' -- Expirée (dépassé validité)
);
-- ═══ TABLE: rfq_requests ═══
CREATE TABLE rfq_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    -- Route & Cargo
    origin_port VARCHAR(255) NOT NULL,
    destination_port VARCHAR(255) NOT NULL,
    cargo_type VARCHAR(255) NOT NULL,
    cargo_description TEXT,
    -- Dimensions & Weight
    weight_kg DECIMAL(10, 2),
    volume_cbm DECIMAL(10, 4),
    length_cm DECIMAL(10, 2),
    width_cm DECIMAL(10, 2),
    height_cm DECIMAL(10, 2),
    quantity INTEGER DEFAULT 1,
    -- Transport Preferences
    transport_mode transport_mode NOT NULL,
    service_type service_type NOT NULL,
    preferred_departure_date DATE,
    required_delivery_date DATE,
    -- Budget & Services
    budget_amount DECIMAL(10, 2),
    budget_currency VARCHAR(3) DEFAULT 'XOF',
    services_needed TEXT [],
    -- ['customs_clearance', 'door_to_door', 'insurance', 'packaging', 'storage']
    special_requirements TEXT,
    -- Targeting
    specific_forwarder_id UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        -- Status & Metadata
        status rfq_status DEFAULT 'draft' NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        -- Constraints
        CONSTRAINT valid_dates CHECK (
            required_delivery_date IS NULL
            OR preferred_departure_date IS NULL
            OR required_delivery_date > preferred_departure_date
        ),
        CONSTRAINT valid_dimensions CHECK (
            (
                transport_mode = 'sea'
                AND volume_cbm IS NOT NULL
            )
            OR (
                transport_mode = 'air'
                AND weight_kg IS NOT NULL
            )
            OR (
                length_cm IS NOT NULL
                AND width_cm IS NOT NULL
                AND height_cm IS NOT NULL
            )
        ),
        CONSTRAINT valid_budget CHECK (
            budget_amount IS NULL
            OR budget_amount > 0
        )
);
-- Indexes pour performance
CREATE INDEX idx_rfq_status ON rfq_requests(status);
CREATE INDEX idx_rfq_client ON rfq_requests(client_id);
CREATE INDEX idx_rfq_forwarder ON rfq_requests(specific_forwarder_id);
CREATE INDEX idx_rfq_expires ON rfq_requests(expires_at)
WHERE expires_at IS NOT NULL;
CREATE INDEX idx_rfq_created ON rfq_requests(created_at DESC);
CREATE INDEX idx_rfq_mode ON rfq_requests(transport_mode);
-- ═══ TABLE: rfq_offers ═══
CREATE TABLE rfq_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
    forwarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    -- Pricing Breakdown
    base_price DECIMAL(10, 2) NOT NULL,
    insurance_price DECIMAL(10, 2) DEFAULT 0,
    customs_clearance_price DECIMAL(10, 2) DEFAULT 0,
    door_to_door_price DECIMAL(10, 2) DEFAULT 0,
    packaging_price DECIMAL(10, 2) DEFAULT 0,
    storage_price DECIMAL(10, 2) DEFAULT 0,
    other_fees DECIMAL(10, 2) DEFAULT 0,
    other_fees_description TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF' NOT NULL,
    -- Transit Information
    estimated_transit_days INTEGER NOT NULL,
    departure_date DATE,
    arrival_date DATE,
    -- Services & Conditions
    services_included TEXT [],
    -- Services inclus dans le prix de base
    services_optional JSONB,
    -- {service_name: price} pour services optionnels
    terms_and_conditions TEXT,
    validity_days INTEGER DEFAULT 7 NOT NULL,
    -- Validité de l'offre en jours
    -- Communication
    message_to_client TEXT,
    -- Status & Metadata
    status offer_status DEFAULT 'pending' NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejected_reason TEXT,
    -- Constraints
    CONSTRAINT unique_forwarder_offer UNIQUE(rfq_id, forwarder_id),
    CONSTRAINT valid_pricing CHECK (
        total_price > 0
        AND base_price > 0
    ),
    CONSTRAINT valid_transit CHECK (estimated_transit_days > 0),
    CONSTRAINT valid_validity CHECK (validity_days > 0),
    CONSTRAINT valid_dates CHECK (
        departure_date IS NULL
        OR arrival_date IS NULL
        OR arrival_date > departure_date
    )
);
-- Indexes pour performance
CREATE INDEX idx_offer_rfq ON rfq_offers(rfq_id);
CREATE INDEX idx_offer_forwarder ON rfq_offers(forwarder_id);
CREATE INDEX idx_offer_status ON rfq_offers(status);
CREATE INDEX idx_offer_submitted ON rfq_offers(submitted_at DESC);
CREATE INDEX idx_offer_expires ON rfq_offers(expires_at)
WHERE expires_at IS NOT NULL;
-- ═══ ROW LEVEL SECURITY (RLS) ═══
-- Enable RLS
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_offers ENABLE ROW LEVEL SECURITY;
-- ═══ RFQ REQUESTS POLICIES ═══
-- Clients peuvent voir leurs propres demandes
CREATE POLICY "Clients can view own RFQs" ON rfq_requests FOR
SELECT USING (auth.uid() = client_id);
-- Clients peuvent créer des demandes
CREATE POLICY "Clients can create RFQs" ON rfq_requests FOR
INSERT WITH CHECK (auth.uid() = client_id);
-- Clients peuvent modifier leurs demandes (si status = draft)
CREATE POLICY "Clients can update own draft RFQs" ON rfq_requests FOR
UPDATE USING (
        auth.uid() = client_id
        AND status = 'draft'
    ) WITH CHECK (auth.uid() = client_id);
-- Clients peuvent supprimer leurs brouillons
CREATE POLICY "Clients can delete own draft RFQs" ON rfq_requests FOR DELETE USING (
    auth.uid() = client_id
    AND status = 'draft'
);
-- Transitaires peuvent voir les demandes publiées (générales ou ciblées vers eux)
CREATE POLICY "Forwarders can view published RFQs" ON rfq_requests FOR
SELECT USING (
        status IN ('published', 'offers_received')
        AND (
            specific_forwarder_id IS NULL
            OR specific_forwarder_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'forwarder'
        )
    );
-- Admins peuvent tout voir
CREATE POLICY "Admins can view all RFQs" ON rfq_requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- Admins peuvent tout modifier
CREATE POLICY "Admins can update all RFQs" ON rfq_requests FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- ═══ RFQ OFFERS POLICIES ═══
-- Transitaires peuvent voir leurs propres offres
CREATE POLICY "Forwarders can view own offers" ON rfq_offers FOR
SELECT USING (
        auth.uid() = forwarder_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'forwarder'
        )
    );
-- Clients peuvent voir les offres sur leurs demandes
CREATE POLICY "Clients can view offers on their RFQs" ON rfq_offers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM rfq_requests
            WHERE id = rfq_id
                AND client_id = auth.uid()
        )
    );
-- Transitaires peuvent créer des offres
CREATE POLICY "Forwarders can create offers" ON rfq_offers FOR
INSERT WITH CHECK (
        auth.uid() = forwarder_id
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'forwarder'
        )
        AND EXISTS (
            SELECT 1
            FROM rfq_requests
            WHERE id = rfq_id
                AND status IN ('published', 'offers_received')
        )
    );
-- Transitaires peuvent modifier leurs offres (si status = pending)
CREATE POLICY "Forwarders can update own pending offers" ON rfq_offers FOR
UPDATE USING (
        auth.uid() = forwarder_id
        AND status = 'pending'
    ) WITH CHECK (auth.uid() = forwarder_id);
-- Transitaires peuvent supprimer leurs offres (si status = pending)
CREATE POLICY "Forwarders can delete own pending offers" ON rfq_offers FOR DELETE USING (
    auth.uid() = forwarder_id
    AND status = 'pending'
);
-- Clients peuvent mettre à jour le statut des offres (accepter/rejeter)
CREATE POLICY "Clients can update offer status" ON rfq_offers FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM rfq_requests
            WHERE id = rfq_id
                AND client_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM rfq_requests
            WHERE id = rfq_id
                AND client_id = auth.uid()
        )
    );
-- Admins peuvent tout voir et modifier
CREATE POLICY "Admins can view all offers" ON rfq_offers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
CREATE POLICY "Admins can update all offers" ON rfq_offers FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- ═══ TRIGGERS & FUNCTIONS ═══
-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger: Update updated_at on rfq_requests
CREATE TRIGGER update_rfq_requests_updated_at BEFORE
UPDATE ON rfq_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function: Auto-update RFQ status when first offer received
CREATE OR REPLACE FUNCTION update_rfq_status_on_offer() RETURNS TRIGGER AS $$ BEGIN
UPDATE rfq_requests
SET status = 'offers_received'
WHERE id = NEW.rfq_id
    AND status = 'published';
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger: Update RFQ status when offer submitted
CREATE TRIGGER on_offer_submitted
AFTER
INSERT ON rfq_offers FOR EACH ROW EXECUTE FUNCTION update_rfq_status_on_offer();
-- Function: Auto-set offer expiration date
CREATE OR REPLACE FUNCTION set_offer_expiration() RETURNS TRIGGER AS $$ BEGIN IF NEW.expires_at IS NULL THEN NEW.expires_at = NEW.submitted_at + (NEW.validity_days || ' days')::INTERVAL;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger: Set expiration on offer creation
CREATE TRIGGER set_offer_expiration_trigger BEFORE
INSERT ON rfq_offers FOR EACH ROW EXECUTE FUNCTION set_offer_expiration();
-- ═══ COMMENTS ═══
COMMENT ON TABLE rfq_requests IS 'Demandes de devis créées par les clients';
COMMENT ON TABLE rfq_offers IS 'Offres soumises par les transitaires en réponse aux RFQs';
COMMENT ON COLUMN rfq_requests.specific_forwarder_id IS 'Si renseigné, seul ce transitaire peut voir la demande';
COMMENT ON COLUMN rfq_offers.services_optional IS 'JSON object: {service_name: price} pour services optionnels';