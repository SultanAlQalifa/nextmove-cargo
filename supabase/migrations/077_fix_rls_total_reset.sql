-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Total RLS Reset & Unified Standardization (Phase 12 - V3)
-- ═══════════════════════════════════════════════════════════════
-- Goal: Eliminate "multiple_permissive_policies" by merging Admin access 
-- into standard ownership/public policies.
SET search_path = public;
-- Helper to safely drop all policies on a table
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname,
        tablename
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %I.%I',
    r.policyname,
    'public',
    r.tablename
);
END LOOP;
END $$;
-- ═══════════════════════════════════════════════════════════════
-- 1. UTILITY: Re-enable RLS on all tables
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE tbl RECORD;
BEGIN FOR tbl IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
) LOOP EXECUTE format(
    'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
    tbl.tablename
);
END LOOP;
END $$;
-- ═══════════════════════════════════════════════════════════════
-- 2. DYNAMIC UNIFIED POLICY IMPLEMENTATION
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE tbl_name TEXT;
ownership_check TEXT;
public_check TEXT;
BEGIN -- For each table, we will apply a set of standardized policies
FOR tbl_name IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
) LOOP -- Reset checks
ownership_check := NULL;
public_check := NULL;
-- 1. Determine Ownership Logic (Priority order)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'user_id'
) THEN ownership_check := 'user_id = (SELECT auth.uid())';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'client_id'
) THEN ownership_check := 'client_id = (SELECT auth.uid())';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'forwarder_id'
) THEN ownership_check := 'forwarder_id = (SELECT auth.uid())';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'agent_id'
) THEN ownership_check := 'agent_id = (SELECT auth.uid())';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'driver_id'
) THEN ownership_check := 'driver_id = (SELECT auth.uid())';
END IF;
-- 2. Determine Public Logic
IF tbl_name IN (
    'academy_courses',
    'academy_lessons',
    'academy_reviews',
    'academy_quizzes',
    'academy_quiz_options',
    'academy_quiz_questions',
    'blog_posts',
    'faqs',
    'fee_configs',
    'locations',
    'package_types',
    'payment_gateways',
    'platform_features',
    'platform_rates',
    'platform_settings',
    'subscription_plans',
    'system_settings',
    'testimonials',
    'delivery_updates'
) THEN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'status'
) THEN public_check := 'status = ''published''';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl_name
        AND column_name = 'is_sensitive'
) THEN public_check := 'NOT is_sensitive';
ELSE public_check := 'true';
END IF;
END IF;
-- 3. Create UNIFIED Policies
-- A. SELECT POLICY (Unifies Admin + Public + Owner)
IF ownership_check IS NOT NULL
AND public_check IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Standard_Select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin() OR %s OR %s)',
    tbl_name,
    ownership_check,
    public_check
);
ELSIF ownership_check IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Standard_Select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin() OR %s)',
    tbl_name,
    ownership_check
);
ELSIF public_check IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Standard_Select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin() OR %s)',
    tbl_name,
    public_check
);
ELSE EXECUTE format(
    'CREATE POLICY "Standard_Select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin())',
    tbl_name
);
END IF;
-- B. Politiques d''ÉCRITURE (Évite le chevauchement avec SELECT)
IF ownership_check IS NOT NULL THEN EXECUTE format(
    'CREATE POLICY "Standard_Insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR %s)',
    tbl_name,
    ownership_check
);
EXECUTE format(
    'CREATE POLICY "Standard_Update" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin() OR %s)',
    tbl_name,
    ownership_check
);
EXECUTE format(
    'CREATE POLICY "Standard_Delete" ON public.%I FOR DELETE TO authenticated USING (public.is_admin() OR %s)',
    tbl_name,
    ownership_check
);
ELSE EXECUTE format(
    'CREATE POLICY "Standard_Insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
    tbl_name
);
EXECUTE format(
    'CREATE POLICY "Standard_Update" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin())',
    tbl_name
);
EXECUTE format(
    'CREATE POLICY "Standard_Delete" ON public.%I FOR DELETE TO authenticated USING (public.is_admin())',
    tbl_name
);
END IF;
END LOOP;
END $$;
-- ═══════════════════════════════════════════════════════════════
-- 3. SPECIFIC REFINEMENTS (Relationship based)
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- 3.1 Ticket Messages (Owner of ticket or Admin)
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'ticket_messages'
)
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'ticket_id'
) THEN DROP POLICY IF EXISTS "Standard_Write" ON public.ticket_messages;
DROP POLICY IF EXISTS "Standard_Select" ON public.ticket_messages;
DROP POLICY IF EXISTS "Standard_Full_Access" ON public.ticket_messages;
DROP POLICY IF EXISTS "Standard_Insert" ON public.ticket_messages;
DROP POLICY IF EXISTS "Standard_Update" ON public.ticket_messages;
DROP POLICY IF EXISTS "Standard_Delete" ON public.ticket_messages;
EXECUTE 'CREATE POLICY "Standard_Select" ON public.ticket_messages FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = (SELECT auth.uid())))';
EXECUTE 'CREATE POLICY "Standard_Insert" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = (SELECT auth.uid())))';
EXECUTE 'CREATE POLICY "Standard_Update" ON public.ticket_messages FOR UPDATE TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = (SELECT auth.uid())))';
EXECUTE 'CREATE POLICY "Standard_Delete" ON public.ticket_messages FOR DELETE TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = (SELECT auth.uid())))';
END IF;
-- 3.2 Quotes (Related Request Client or Forwarder or Admin)
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'quotes'
) THEN
DECLARE col_name TEXT;
BEGIN
SELECT column_name INTO col_name
FROM information_schema.columns
WHERE table_name = 'quotes'
    AND column_name IN ('quote_request_id', 'request_id')
LIMIT 1;
IF col_name IS NOT NULL THEN DROP POLICY IF EXISTS "Standard_Write" ON public.quotes;
DROP POLICY IF EXISTS "Standard_Select" ON public.quotes;
DROP POLICY IF EXISTS "Standard_Insert" ON public.quotes;
DROP POLICY IF EXISTS "Standard_Update" ON public.quotes;
DROP POLICY IF EXISTS "Standard_Delete" ON public.quotes;
DROP POLICY IF EXISTS "Standard_Full_Access" ON public.quotes;
EXECUTE format(
    'CREATE POLICY "Standard_Select" ON public.quotes FOR SELECT TO authenticated USING (public.is_admin() OR forwarder_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.quote_requests r WHERE r.id = %I AND r.client_id = (SELECT auth.uid())))',
    col_name
);
EXECUTE 'CREATE POLICY "Standard_Insert" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR forwarder_id = (SELECT auth.uid()))';
EXECUTE 'CREATE POLICY "Standard_Update" ON public.quotes FOR UPDATE TO authenticated USING (public.is_admin() OR forwarder_id = (SELECT auth.uid()))';
EXECUTE 'CREATE POLICY "Standard_Delete" ON public.quotes FOR DELETE TO authenticated USING (public.is_admin() OR forwarder_id = (SELECT auth.uid()))';
END IF;
END;
END IF;
-- 3.3 Shipment PODs (Related Shipment Client/Forwarder or Admin)
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'shipment_pods'
)
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipment_pods'
        AND column_name = 'shipment_id'
) THEN DROP POLICY IF EXISTS "Standard_Write" ON public.shipment_pods;
DROP POLICY IF EXISTS "Standard_Select" ON public.shipment_pods;
DROP POLICY IF EXISTS "Standard_Full_Access" ON public.shipment_pods;
DROP POLICY IF EXISTS "Standard_Insert" ON public.shipment_pods;
DROP POLICY IF EXISTS "Standard_Update" ON public.shipment_pods;
DROP POLICY IF EXISTS "Standard_Delete" ON public.shipment_pods;
EXECUTE 'CREATE POLICY "Standard_Select" ON public.shipment_pods FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))))';
EXECUTE 'CREATE POLICY "Standard_Insert" ON public.shipment_pods FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))))';
EXECUTE 'CREATE POLICY "Standard_Update" ON public.shipment_pods FOR UPDATE TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))))';
EXECUTE 'CREATE POLICY "Standard_Delete" ON public.shipment_pods FOR DELETE TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))))';
END IF;
END $$;