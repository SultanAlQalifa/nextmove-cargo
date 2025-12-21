-- Migration to fix RLS policies and schema for forwarder_documents
-- 1. Ensure columns match the application code (forwarderService.ts uses document_type and document_url)
DO $$ BEGIN -- Rename 'type' to 'document_type' if it exists and 'document_type' does not
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'type'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'document_type'
) THEN
ALTER TABLE forwarder_documents
    RENAME COLUMN "type" TO "document_type";
END IF;
-- Rename 'url' to 'document_url' if it exists and 'document_url' does not
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'url'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'document_url'
) THEN
ALTER TABLE forwarder_documents
    RENAME COLUMN "url" TO "document_url";
END IF;
-- Handle 'name' column if it exists and is NOT NULL (application might not be sending it)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'name'
        AND is_nullable = 'NO'
) THEN
ALTER TABLE forwarder_documents
ALTER COLUMN "name" DROP NOT NULL;
END IF;
-- Ensure document_type exists if it wasn't renamed from type
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'document_type'
) THEN
ALTER TABLE forwarder_documents
ADD COLUMN "document_type" VARCHAR(50);
END IF;
-- Ensure document_url exists if it wasn't renamed from url
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'forwarder_documents'
        AND column_name = 'document_url'
) THEN
ALTER TABLE forwarder_documents
ADD COLUMN "document_url" TEXT;
END IF;
END $$;
-- 2. Reset and Fix RLS Policies
ALTER TABLE forwarder_documents ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Forwarders can view own documents" ON forwarder_documents;
DROP POLICY IF EXISTS "Forwarders can upload own documents" ON forwarder_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON forwarder_documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON forwarder_documents;
-- Create Policies
-- Policy for Forwarders (View Own)
CREATE POLICY "Forwarders can view own documents" ON forwarder_documents FOR
SELECT TO authenticated USING (auth.uid() = forwarder_id);
-- Policy for Forwarders (Insert Own)
CREATE POLICY "Forwarders can upload own documents" ON forwarder_documents FOR
INSERT TO authenticated WITH CHECK (auth.uid() = forwarder_id);
-- Policy for Forwarders (Update Own - e.g. re-upload)
CREATE POLICY "Forwarders can update own documents" ON forwarder_documents FOR
UPDATE TO authenticated USING (auth.uid() = forwarder_id);
-- Policy for Admins (View ALL) - Critical for Admin Dashboard
CREATE POLICY "Admins can view all documents" ON forwarder_documents FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'super-admin')
        )
    );
-- Policy for Admins (Manage ALL - optional but good for cleanup)
CREATE POLICY "Admins can manage all documents" ON forwarder_documents FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);