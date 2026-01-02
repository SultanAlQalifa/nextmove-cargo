-- Create Feature Flags Table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
-- Read access for all authenticated users
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags FOR
SELECT TO authenticated USING (true);
-- Full access for admins
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);
-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_feature_flags BEFORE
UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime (updated_at);
-- Seed initial flags
INSERT INTO public.feature_flags (key, is_enabled, description)
VALUES (
        'ai_smart_scan',
        true,
        'Enable AI-powered document scanning (OCR) in chat'
    ),
    (
        'academy_portal',
        true,
        'Enable the educational academy dashboard'
    ),
    (
        'predictive_analytics',
        true,
        'Enable cost forecasts and impact scores'
    ),
    (
        'beta_features',
        false,
        'Enable experimental features for testing'
    ) ON CONFLICT (key) DO NOTHING;