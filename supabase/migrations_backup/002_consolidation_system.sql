-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Consolidation (Groupage) System
-- Phase 2: Groupage & Co-loading
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
CREATE TYPE consolidation_type AS ENUM (
    'forwarder_offer',
    -- Transitaire propose un groupage (LCL)
    'client_request' -- Client cherche un partenaire (Co-loading)
);
CREATE TYPE consolidation_status AS ENUM (
    'open',
    -- Ouvert aux réservations/partenaires
    'closing_soon',
    -- Fermeture imminente
    'full',
    -- Complet
    'in_transit',
    -- En cours d'expédition
    'completed',
    -- Arrivé / Terminé
    'cancelled' -- Annulé
);
-- ═══ TABLE: consolidations ═══
CREATE TABLE consolidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    -- Créateur (Transitaire ou Client)
    type consolidation_type NOT NULL,
    -- Route
    origin_port VARCHAR(255) NOT NULL,
    destination_port VARCHAR(255) NOT NULL,
    transport_mode transport_mode NOT NULL,
    -- Capacity & Load
    total_capacity_cbm DECIMAL(10, 2),
    -- Capacité totale cible (ex: 33 CBM pour 20ft)
    total_capacity_kg DECIMAL(10, 2),
    current_load_cbm DECIMAL(10, 2) DEFAULT 0,
    current_load_kg DECIMAL(10, 2) DEFAULT 0,
    -- Dates
    departure_date DATE,
    arrival_date DATE,
    deadline_date DATE,
    -- Date limite pour rejoindre
    -- Pricing (Principalement pour forwarder_offer)
    price_per_cbm DECIMAL(10, 2),
    price_per_kg DECIMAL(10, 2),
    min_cbm DECIMAL(10, 2) DEFAULT 1,
    -- Minimum requis pour rejoindre
    currency VARCHAR(3) DEFAULT 'XOF',
    -- Metadata
    title VARCHAR(255),
    -- Ex: "Groupage Dakar Fin Novembre"
    description TEXT,
    status consolidation_status DEFAULT 'open' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    -- Constraints
    CONSTRAINT valid_dates CHECK (
        deadline_date <= departure_date
        AND (
            arrival_date IS NULL
            OR arrival_date > departure_date
        )
    )
);
-- ═══ LINK RFQ TO CONSOLIDATION ═══
-- Ajouter une référence vers une consolidation dans la table RFQ
-- Si un client rejoint un groupage, son RFQ est lié à cette consolidation
ALTER TABLE rfq_requests
ADD COLUMN consolidation_id UUID REFERENCES consolidations(id) ON DELETE
SET NULL;
-- ═══ INDEXES ═══
CREATE INDEX idx_consolidation_status ON consolidations(status);
CREATE INDEX idx_consolidation_route ON consolidations(origin_port, destination_port);
CREATE INDEX idx_consolidation_date ON consolidations(departure_date);
CREATE INDEX idx_consolidation_initiator ON consolidations(initiator_id);
-- ═══ RLS POLICIES ═══
ALTER TABLE consolidations ENABLE ROW LEVEL SECURITY;
-- Tout le monde peut voir les consolidations ouvertes (Marketplace)
CREATE POLICY "Anyone can view open consolidations" ON consolidations FOR
SELECT USING (status IN ('open', 'closing_soon', 'full'));
-- Les créateurs peuvent tout faire sur leurs consolidations
CREATE POLICY "Initiators can manage own consolidations" ON consolidations FOR ALL USING (auth.uid() = initiator_id) WITH CHECK (auth.uid() = initiator_id);
-- Admins peuvent tout faire
CREATE POLICY "Admins can manage all consolidations" ON consolidations FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ TRIGGERS ═══
-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_consolidations_updated_at BEFORE
UPDATE ON consolidations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();