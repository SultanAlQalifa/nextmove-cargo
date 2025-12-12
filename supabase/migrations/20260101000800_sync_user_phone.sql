-- 1. Ensure phone column exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;
-- 2. Update the trigger function to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN BEGIN
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes,
        phone
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
        -- Phone number from Auth
        NEW.phone
    ) ON CONFLICT (id) DO
UPDATE
SET transport_modes = EXCLUDED.transport_modes,
    phone = EXCLUDED.phone;
EXCEPTION
WHEN OTHERS THEN -- Log error
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_error',
        jsonb_build_object(
            'error_message',
            SQLERRM,
            'error_state',
            SQLSTATE,
            'user_id',
            NEW.id,
            'user_email',
            NEW.email
        )
    );
RAISE WARNING 'Profile creation failed for user %: %',
NEW.id,
SQLERRM;
END;
RETURN NEW;
END;
$$;
-- 3. Backfill existing phone numbers
UPDATE public.profiles p
SET phone = u.phone
FROM auth.users u
WHERE p.id = u.id
    AND p.phone IS NULL
    AND u.phone IS NOT NULL;