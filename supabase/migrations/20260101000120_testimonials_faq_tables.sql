-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL DEFAULT 'Général',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
-- Policies for testimonials
CREATE POLICY "Public read active testimonials" ON public.testimonials FOR
SELECT USING (is_active = true);
CREATE POLICY "Admin full access on testimonials" ON public.testimonials FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- Policies for FAQs
CREATE POLICY "Public read active faqs" ON public.faqs FOR
SELECT USING (is_active = true);
CREATE POLICY "Admin full access on faqs" ON public.faqs FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- Insert initial testimonials from branding
INSERT INTO public.testimonials (name, role, content, rating, display_order)
VALUES (
        'Alpha Diallo',
        'Importateur Textile',
        'Grâce à NextMove Cargo, mes délais d''expédition depuis la Chine ont été réduits de 15 jours. Le suivi en temps réel est incroyable.',
        5,
        1
    ),
    (
        'Sophie Mbacké',
        'E-commerçante',
        'Le service de groupage est parfait pour mon business. Je recommande vivement pour le professionnalisme de l''équipe.',
        5,
        2
    ),
    (
        'William Koffi',
        'Directeur Logistique',
        'La plateforme la plus complète que j''ai utilisée en Afrique de l''Ouest. La transparence des prix est un vrai plus.',
        5,
        3
    );
-- Insert initial FAQs
INSERT INTO public.faqs (category, question, answer, display_order)
VALUES (
        'Expéditions',
        'Quels sont les délais moyens depuis la Chine ?',
        'Pour le fret aérien, comptez 7 à 10 jours. Pour le fret maritime, prévoyez entre 35 et 45 jours selon le port de destination.',
        1
    ),
    (
        'Paiements',
        'Quels modes de paiement acceptez-vous ?',
        'Nous acceptons Wave, Orange Money, les virements bancaires et les paiements par carte via nos passerelles sécurisées.',
        2
    ),
    (
        'Services',
        'Proposez-vous une assurance pour les marchandises ?',
        'Oui, nous proposons une assurance optionnelle couvrant jusqu''à 100% de la valeur déclarée de vos marchandises.',
        3
    );