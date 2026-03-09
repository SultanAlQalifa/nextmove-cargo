-- Migration: Security Hardening - Payments and Internal Infrastructure
-- Description: Adds RLS policies to payments, transactions, and email_queue tables.
-- ═══════════════════════════════════════════════════════════════
-- 1. PAYMENTS & TRANSACTIONS (Dynamic Column Handling)
DO $$
DECLARE tbl_rec RECORD;
col_name TEXT;
BEGIN -- We use a query to iterate over the tables to ensure they exist and handle them dynamically
FOR tbl_rec IN (
    SELECT UNNEST(ARRAY ['payments', 'transactions']) as name
) LOOP -- Skip if table doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = tbl_rec.name
) THEN RAISE NOTICE 'Table % does not exist, skipping RLS hardening for it.',
tbl_rec.name;
CONTINUE;
END IF;
-- Enable RLS
EXECUTE format(
    'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
    tbl_rec.name
);
-- Find best candidate for user isolation
col_name := NULL;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_rec.name
        AND column_name = 'user_id'
) THEN col_name := 'user_id';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_rec.name
        AND column_name = 'client_id'
) THEN col_name := 'client_id';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_rec.name
        AND column_name = 'owner_id'
) THEN col_name := 'owner_id';
END IF;
-- Drop existing policy
EXECUTE format(
    'DROP POLICY IF EXISTS "Users can view own %s" ON public.%I',
    tbl_rec.name,
    tbl_rec.name
);
-- Create policy if column found
IF col_name IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Users can view own %s" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = %I OR public.is_admin())',
    tbl_rec.name,
    tbl_rec.name,
    col_name
);
ELSE -- Fallback: If it's payments and has shipment_id, use that to link via shipments table
IF tbl_rec.name = 'payments'
AND EXISTS (
    SELECT 1
)
AND EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'shipments'
) THEN EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))) OR public.is_admin())';
ELSE -- Absolute Fallback: Admin ONLY access for safety
EXECUTE format(
    'CREATE POLICY "Users can view own %s" ON public.%I FOR SELECT TO authenticated USING (public.is_admin())',
    tbl_rec.name,
    tbl_rec.name
);
END IF;
END IF;
END LOOP;
END $$;
-- 2. EMAIL QUEUE (Privacy)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'email_queue'
) THEN
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage email queue" ON public.email_queue;
CREATE POLICY "Admins can manage email queue" ON public.email_queue FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "System can view email queue" ON public.email_queue;
CREATE POLICY "System can view email queue" ON public.email_queue FOR
SELECT TO service_role USING (true);
-- Fallback policy if someone mistakenly tries to access it
DROP POLICY IF EXISTS "Admins can view email queue" ON public.email_queue;
CREATE POLICY "Admins can view email queue" ON public.email_queue FOR
SELECT TO authenticated USING (public.is_admin());
END IF;
END $$;
-- 3. SYSTEM SETTINGS
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'system_settings'
) THEN
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.system_settings;
CREATE POLICY "Allow public read access to settings" ON public.system_settings FOR
SELECT TO anon,
    authenticated USING (true);
DROP POLICY IF EXISTS "Allow only admins to modify settings" ON public.system_settings;
CREATE POLICY "Allow only admins to modify settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin());
END IF;
END $$;