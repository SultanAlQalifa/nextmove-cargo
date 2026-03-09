-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Service Branches & Arborescences
-- Permet de gérer la hiérarchie des services de la plateforme.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.service_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.service_branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    -- Lucide icon name
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    "position" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.service_branches ENABLE ROW LEVEL SECURITY;
-- Policies
DROP POLICY IF EXISTS "Anyone can read active service branches" ON public.service_branches;
CREATE POLICY "Anyone can read active service branches" ON public.service_branches FOR
SELECT USING (
        is_active = true
        OR public.is_admin()
    );
DROP POLICY IF EXISTS "Admins manage service branches" ON public.service_branches;
CREATE POLICY "Admins manage service branches" ON public.service_branches FOR ALL USING (public.is_admin());
-- Standard triggers for updated_at
DROP TRIGGER IF EXISTS update_service_branches_updated_at ON public.service_branches;
CREATE TRIGGER update_service_branches_updated_at BEFORE
UPDATE ON public.service_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Seed some initial data
INSERT INTO public.service_branches (name, slug, icon, "position")
VALUES ('Fret Aérien', 'air-cargo', 'Plane', 1),
    ('Fret Maritime', 'sea-cargo', 'Ship', 2),
    ('Fret Routier', 'road-cargo', 'Truck', 3),
    (
        'Sourcing & Achats',
        'sourcing',
        'ShoppingBag',
        4
    ) ON CONFLICT (slug) DO NOTHING;
-- Sub-branches for Air
INSERT INTO public.service_branches (parent_id, name, slug, icon, "position")
SELECT id,
    'Air Standard',
    'air-standard',
    'Clock',
    1
FROM public.service_branches
WHERE slug = 'air-cargo' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.service_branches (parent_id, name, slug, icon, "position")
SELECT id,
    'Air Express',
    'air-express',
    'Zap',
    2
FROM public.service_branches
WHERE slug = 'air-cargo' ON CONFLICT (slug) DO NOTHING;
-- Sub-branches for Sea
INSERT INTO public.service_branches (parent_id, name, slug, icon, "position")
SELECT id,
    'FCL (Conteneur Complet)',
    'sea-fcl',
    'Box',
    1
FROM public.service_branches
WHERE slug = 'sea-cargo' ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.service_branches (parent_id, name, slug, icon, "position")
SELECT id,
    'LCL (Groupage)',
    'sea-lcl',
    'Package',
    2
FROM public.service_branches
WHERE slug = 'sea-cargo' ON CONFLICT (slug) DO NOTHING;