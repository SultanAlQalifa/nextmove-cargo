-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    category TEXT,
    author_id UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- Policies
-- Everyone can read published posts
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR
SELECT USING (true);
-- Only admins can manage posts
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Add some seed data
INSERT INTO public.blog_posts (
        title,
        slug,
        excerpt,
        content,
        featured_image,
        category
    )
VALUES (
        'Optimiser vos coûts d''importation en 2025',
        'optimiser-couts-importation-2025',
        'Découvrez les nouvelles réglementations douanières au Sénégal et comment le groupage peut réduire vos factures de 30%.',
        'Contenu détaillé de l''article sur l''optimisation des coûts...',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
        'Conseils'
    ),
    (
        'Transport Aérien vs Maritime : Que choisir ?',
        'transport-aerien-vs-maritime',
        'Un guide comparatif complet pour vous aider à prendre la meilleure décision selon l''urgence et le volume de vos marchandises.',
        'Contenu détaillé sur le choix entre aérien et maritime...',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800',
        'Guide'
    ),
    (
        'L''impact de l''IA sur la logistique africaine',
        'impact-ia-logistique-africaine',
        'Comment NextMove Cargo utilise l''intelligence artificielle pour prédire les délais et sécuriser vos expéditions.',
        'Contenu détaillé sur l''IA dans la logistique...',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
        'Technologie'
    ) ON CONFLICT (slug) DO NOTHING;