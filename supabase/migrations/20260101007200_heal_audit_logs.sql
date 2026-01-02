-- HEALING MIGRATION: Unify audit_logs schema across frontend and backend systems
DO $$ BEGIN -- 1. Ensure columns for frontend AuditService exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'user_id'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE
SET NULL;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'action'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN action TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'resource'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN resource TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'resource_id'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN resource_id TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'details'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'metadata'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'ip_address'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN ip_address TEXT;
END IF;
-- 2. Drop NOT NULL constraints from newer columns to allow frontend insertion
ALTER TABLE public.audit_logs
ALTER COLUMN table_name DROP NOT NULL;
ALTER TABLE public.audit_logs
ALTER COLUMN record_id DROP NOT NULL;
ALTER TABLE public.audit_logs
ALTER COLUMN operation DROP NOT NULL;
-- 3. Sync user_id and changed_by if both exist (for consistency)
-- We can set a trigger later, but for now just having them both is enough.
END $$;
-- 4. Ensure RLS allows insertion for authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert entries" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert entries" ON public.audit_logs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 5. Force schema cache refresh (PostgREST)
-- Typically, any DDL change should trigger a refresh, but 
-- Supabase might need a explicit reload if it persists.
-- Reloading schema can be done via API or just by making a comment.
COMMENT ON TABLE public.audit_logs IS 'System Audit Logs (Unified Schema)';