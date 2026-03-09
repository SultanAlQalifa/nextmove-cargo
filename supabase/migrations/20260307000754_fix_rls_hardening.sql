-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - RLS Security Hardening (Phase 9)
-- Description: Replaces permissive WITH CHECK (true) on payments
-- with relationship-based validation.
-- ═══════════════════════════════════════════════════════════════
SET search_path = public;
DO $$
DECLARE column_exists_user_id BOOLEAN;
column_exists_shipment_id BOOLEAN;
BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'payments'
) THEN -- Drop the permissive policy identified by the linter
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments'
            AND column_name = 'user_id'
    ) INTO column_exists_user_id;
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments'
            AND column_name = 'shipment_id'
    ) INTO column_exists_shipment_id;
IF column_exists_user_id THEN EXECUTE 'CREATE POLICY "Users can create payments" ON public.payments 
                     FOR INSERT TO authenticated 
                     WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin())';
ELSIF column_exists_shipment_id THEN EXECUTE 'CREATE POLICY "Users can create payments" ON public.payments 
                     FOR INSERT TO authenticated 
                     WITH CHECK (
                         EXISTS (
                             SELECT 1 FROM public.shipments s 
                             WHERE s.id = shipment_id 
                             AND (s.client_id = (SELECT auth.uid()) OR s.forwarder_id = (SELECT auth.uid()))
                         ) 
                         OR public.is_admin()
                     )';
END IF;
END IF;
END $$;