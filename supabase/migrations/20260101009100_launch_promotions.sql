-- Migration: Launch Promotions (3 Months Free Forwarder + 1000 Points Client)
-- Date: 2025-12-15
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_forwarder_count INTEGER;
v_trial_interval INTERVAL;
v_loyalty_points INTEGER := 0;
BEGIN -- 1. Determine Forwarder Trial (Launch Promo: First 100 get 3 months)
IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'forwarder' THEN
SELECT COUNT(*) INTO v_forwarder_count
FROM public.profiles
WHERE role = 'forwarder';
IF v_forwarder_count < 100 THEN v_trial_interval := interval '3 months';
-- Promo
ELSE v_trial_interval := interval '14 days';
-- Standard
END IF;
ELSE -- Clients don't have a trial per se, but we set a default null or keep logic consistent
v_trial_interval := interval '14 days';
END IF;
-- 2. Determine Loyalty Points (Launch Promo: 1000 pts before Jan 2026)
IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'client' THEN IF NOW() < '2026-01-01'::timestamptz THEN v_loyalty_points := 1000;
END IF;
END IF;
-- 3. Insert Profile
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes,
        phone,
        trial_ends_at,
        loyalty_points
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
        -- Trial
        NOW() + v_trial_interval,
        -- Loyalty Points
        v_loyalty_points
    ) ON CONFLICT (id) DO
UPDATE
SET transport_modes = EXCLUDED.transport_modes,
    phone = EXCLUDED.phone,
    loyalty_points = profiles.loyalty_points;
-- Keep existing points on conflict
RETURN NEW;
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
RETURN NEW;
-- Ensure auth user is still created even if profile fails (though ideal is transaction rollback)
END;
$$;