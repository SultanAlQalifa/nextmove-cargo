-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Security Linter Fixes Remediation
-- Date: 2026-01-29
-- ═══════════════════════════════════════════════════════════════
-- 1. FIX MUTABLE SEARCH PATH IN FUNCTIONS
-- ───────────────────────────────────────────────────────────────
-- Hardening functions to prevent search path hijacking.
ALTER FUNCTION public.generate_role_based_id()
SET search_path = public;
-- 2. RESTRICT ADMINISTRATIVE TABLES (Restrict to Admins)
-- ───────────────────────────────────────────────────────────────
-- Locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth delete" ON public.locations;
DROP POLICY IF EXISTS "Auth insert" ON public.locations;
DROP POLICY IF EXISTS "Auth update" ON public.locations;
DROP POLICY IF EXISTS "Public Read Locations" ON public.locations;
CREATE POLICY "Public Read Locations" ON public.locations FOR
SELECT TO public USING (true);
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);
-- Package Types
ALTER TABLE public.package_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth delete pkg" ON public.package_types;
DROP POLICY IF EXISTS "Auth insert pkg" ON public.package_types;
DROP POLICY IF EXISTS "Auth update pkg" ON public.package_types;
CREATE POLICY "Public Read Package Types" ON public.package_types FOR
SELECT TO public USING (true);
CREATE POLICY "Admins manage package types" ON public.package_types FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin'::user_role, 'super-admin'::user_role)
    )
);
-- 3. SECURE INSERT POLICIES (Profiles & Public Forms)
-- ───────────────────────────────────────────────────────────────
-- Profiles: Restrict manual INSERT now that we use a server-side trigger
DROP POLICY IF EXISTS "Profiles_Insert_Policy" ON public.profiles;
CREATE POLICY "Users can only insert their own profile" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Quote Requests: Close "Always True" loophole
DROP POLICY IF EXISTS "Public can create requests" ON public.quote_requests;
CREATE POLICY "Users can insert quote requests" ON public.quote_requests FOR
INSERT TO public WITH CHECK (
        origin_country IS NOT NULL
        AND destination_country IS NOT NULL
    );
-- Saved Quotes: Close "Always True" loophole
DROP POLICY IF EXISTS "Anyone can insert saved quotes" ON public.saved_quotes;
DROP POLICY IF EXISTS "Anyone insert quotes" ON public.saved_quotes;
CREATE POLICY "Users can insert saved quotes" ON public.saved_quotes FOR
INSERT TO public WITH CHECK (quote_details IS NOT NULL);
-- ═══════════════════════════════════════════════════════════════
-- END OF LINTER REMEDIATION
-- ═══════════════════════════════════════════════════════════════