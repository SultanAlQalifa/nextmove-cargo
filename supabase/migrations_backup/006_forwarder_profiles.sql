-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Forwarder Profiles & Documents
-- Phase 5: Forwarder Management
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('active', 'suspended', 'inactive');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- ═══ UPDATE PROFILES TABLE ═══
-- Add columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
-- ═══ TABLE: forwarder_documents ═══
CREATE TABLE IF NOT EXISTS forwarder_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    -- e.g. "Registre de Commerce"
    type VARCHAR(50) NOT NULL,
    -- e.g. "pdf", "jpg"
    url TEXT NOT NULL,
    status document_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_fwd_docs_forwarder ON forwarder_documents(forwarder_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON profiles(role, account_status, verification_status);
-- ═══ RLS POLICIES ═══
ALTER TABLE forwarder_documents ENABLE ROW LEVEL SECURITY;
-- Forwarders can view and upload their own documents
CREATE POLICY "Forwarders can view own documents" ON forwarder_documents FOR
SELECT USING (auth.uid() = forwarder_id);
CREATE POLICY "Forwarders can upload own documents" ON forwarder_documents FOR
INSERT WITH CHECK (auth.uid() = forwarder_id);
-- Admins can view and manage all documents
CREATE POLICY "Admins can view all documents" ON forwarder_documents FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ TRIGGERS ═══
CREATE TRIGGER update_forwarder_documents_updated_at BEFORE
UPDATE ON forwarder_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();