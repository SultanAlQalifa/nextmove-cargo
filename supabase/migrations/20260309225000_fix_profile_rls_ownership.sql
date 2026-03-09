-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Fix Profile RLS Ownership
-- Description: Restores correct ownership conditions for the profiles table.
-- ═══════════════════════════════════════════════════════════════
BEGIN;
-- 1. Drop botched policies from total reset
DROP POLICY IF EXISTS "Standard_Select" ON public.profiles;
DROP POLICY IF EXISTS "Standard_Insert" ON public.profiles;
DROP POLICY IF EXISTS "Standard_Update" ON public.profiles;
DROP POLICY IF EXISTS "Standard_Delete" ON public.profiles;
-- 2. Restore Correct Selective Access
-- Conditions: 
-- - Admins see all
-- - Users see themselves (id = auth.uid())
-- - Forwarders see their assigned users (forwarder_id = auth.uid())
CREATE POLICY "Standard_Select" ON public.profiles FOR
SELECT TO authenticated USING (
        public.is_admin()
        OR id = (
            SELECT auth.uid()
        )
        OR forwarder_id = (
            SELECT auth.uid()
        )
    );
-- 3. Restore Correct Write Access
-- Condition: Users can only insert/update if the record ID matches their auth UID (identity)
CREATE POLICY "Standard_Insert" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (
        public.is_admin()
        OR id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Standard_Update" ON public.profiles FOR
UPDATE TO authenticated USING (
        public.is_admin()
        OR id = (
            SELECT auth.uid()
        )
    );
-- 4. Delete access remains restricted to Admins
CREATE POLICY "Standard_Delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());
COMMIT;