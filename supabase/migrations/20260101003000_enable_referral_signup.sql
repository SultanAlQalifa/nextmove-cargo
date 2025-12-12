-- Migration: Enable Referral Code Processing in Signup
-- Overwrites handle_new_user to process 'referral_code_used' metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_referrer_id UUID;
v_referral_code TEXT;
BEGIN -- 1. Try to resolve Referrer
v_referral_code := NEW.raw_user_meta_data->>'referral_code_used';
IF v_referral_code IS NOT NULL
AND v_referral_code != '' THEN
SELECT id INTO v_referrer_id
FROM public.profiles
WHERE referral_code = v_referral_code;
END IF;
-- 2. Insert Profile
BEGIN
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes,
        phone,
        trial_ends_at,
        referred_by
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
        NOW() + interval '14 days',
        -- Referrer (Resolved above)
        v_referrer_id
    ) ON CONFLICT (id) DO
UPDATE
SET transport_modes = EXCLUDED.transport_modes,
    phone = EXCLUDED.phone;
-- We do NOT update referred_by on conflict to prevent hijacking
EXCEPTION
WHEN OTHERS THEN -- Log error but allow flow to continue (prevent signup blocking)
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
-- 3. Create Referral Record (if valid referrer)
IF v_referrer_id IS NOT NULL
AND v_referrer_id != NEW.id THEN BEGIN
INSERT INTO public.referrals (referrer_id, referred_id, status)
VALUES (v_referrer_id, NEW.id, 'pending') ON CONFLICT (referred_id) DO NOTHING;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Referral record creation failed: %',
SQLERRM;
END;
END IF;
RETURN NEW;
END;
$$;