-- 1. Create Platform Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CONSTRAINT single_row CHECK (id),
    show_founder_offer BOOLEAN DEFAULT FALSE,
    founder_offer_title TEXT DEFAULT 'Pack Fondateur',
    founder_offer_price NUMERIC DEFAULT 5000,
    founder_offer_description TEXT DEFAULT 'Soutenez NextMove Cargo et obtenez le statut Membre Fondateur à vie.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Everyone can view settings" ON public.platform_settings FOR
SELECT USING (true);
CREATE POLICY "Only admins can update settings" ON public.platform_settings FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'super-admin'
        )
    );
-- Insert Default Row if valid
INSERT INTO public.platform_settings (id, show_founder_offer)
VALUES (TRUE, FALSE) ON CONFLICT (id) DO NOTHING;
-- 2. Add Trial Column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
-- 3. Update Trigger (Including Phone + Trial)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN BEGIN
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes,
        phone,
        trial_ends_at
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        -- Robust extraction of transport_modes array
        COALESCE(
            (
                SELECT array_agg(x)
                FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(NEW.raw_user_meta_data->'transport_modes') = 'array' THEN NEW.raw_user_meta_data->'transport_modes'
                            ELSE '[]'::jsonb
                        END
                    ) t(x)
            ),
            '{}'::text []
        ),
        -- Phone number
        NEW.phone,
        -- Trial (14 days from now)
        NOW() + interval '14 days'
    ) ON CONFLICT (id) DO
UPDATE
SET transport_modes = EXCLUDED.transport_modes,
    phone = EXCLUDED.phone;
-- Don't update trial_ends_at on conflict (keep existing logic)
EXCEPTION
WHEN OTHERS THEN -- Log error
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_error',
        jsonb_build_object(
            'error_message',
            SQLERRM,
            'user_id',
            NEW.id
        )
    );
RAISE WARNING 'Profile creation failed for user %: %',
NEW.id,
SQLERRM;
END;
RETURN NEW;
END;
$$;