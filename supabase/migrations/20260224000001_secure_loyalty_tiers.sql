-- Enable Row Level Security (RLS) on the loyalty_tiers table
-- Badges indicating "UNRESTRICTED" highlight that this was previously disabled.
-- We want public read access, but admin-only write access.
BEGIN;
-- 1. Enable RLS
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
-- 2. Clean up any potential existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Admins can insert loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Admins can update loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Admins can delete loyalty tiers" ON public.loyalty_tiers;
-- 3. Public Read Policy
-- Anyone (even unauthenticated users, though we scope to authenticated usually, public read is safe here)
CREATE POLICY "Anyone can view loyalty tiers" ON public.loyalty_tiers FOR
SELECT USING (true);
-- 4. Admin Write Policies (Insert, Update, Delete)
CREATE POLICY "Admins can insert loyalty tiers" ON public.loyalty_tiers FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update loyalty tiers" ON public.loyalty_tiers FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete loyalty tiers" ON public.loyalty_tiers FOR DELETE TO authenticated USING (public.is_admin());
COMMIT;