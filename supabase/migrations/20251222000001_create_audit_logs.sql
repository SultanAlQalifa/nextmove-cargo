-- 20251222000001_create_audit_logs.sql
-- 1. DROP EVERYTHING FIRST (ORDER MATTERS)
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_resource;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
-- 2. CREATE TABLE
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address TEXT
);
-- 3. ENABLE RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- 4. POLICIES
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR
SELECT USING (public.is_admin());
CREATE POLICY "Authenticated users can insert entries" ON public.audit_logs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 5. INDEXES (Safe Create)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);