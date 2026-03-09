-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Consolidation (Groupage) System
-- Phase 2: Groupage & Co-loading
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
DO $$ BEGIN CREATE TYPE consolidation_type AS ENUM ('forwarder_offer', 'client_request');
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE TYPE consolidation_status AS ENUM (
    'open',
    'closing_soon',
    'full',
    'in_transit',
    'completed',
    'cancelled'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- ═══ TABLE: consolidations ═══
CREATE TABLE IF NOT EXISTS consolidations (
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
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rfq_requests'
        AND column_name = 'consolidation_id'
) THEN
ALTER TABLE rfq_requests
ADD COLUMN consolidation_id UUID REFERENCES consolidations(id) ON DELETE
SET NULL;
END IF;
END $$;
-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_consolidation_status ON consolidations(status);
CREATE INDEX IF NOT EXISTS idx_consolidation_route ON consolidations(origin_port, destination_port);
CREATE INDEX IF NOT EXISTS idx_consolidation_date ON consolidations(departure_date);
CREATE INDEX IF NOT EXISTS idx_consolidation_initiator ON consolidations(initiator_id);
-- ═══ RLS POLICIES ═══
ALTER TABLE consolidations ENABLE ROW LEVEL SECURITY;
-- Tout le monde peut voir les consolidations ouvertes (Marketplace)
DROP POLICY IF EXISTS "Anyone can view open consolidations" ON consolidations;
CREATE POLICY "Anyone can view open consolidations" ON consolidations FOR
SELECT USING (status IN ('open', 'closing_soon', 'full'));
-- Les créateurs peuvent tout faire sur leurs consolidations
DROP POLICY IF EXISTS "Initiators can manage own consolidations" ON consolidations;
CREATE POLICY "Initiators can manage own consolidations" ON consolidations FOR ALL USING (
    (
        select auth.uid()
    ) = initiator_id
) WITH CHECK (
    (
        select auth.uid()
    ) = initiator_id
);
-- Admins peuvent tout faire
DROP POLICY IF EXISTS "Admins can manage all consolidations" ON consolidations;
CREATE POLICY "Admins can manage all consolidations" ON consolidations FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = (
                select auth.uid()
            )
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ TRIGGERS ═══
-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_consolidations_updated_at ON consolidations;
CREATE TRIGGER update_consolidations_updated_at BEFORE
UPDATE ON consolidations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();