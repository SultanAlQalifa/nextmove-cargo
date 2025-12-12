-- Update handle_new_user to include transport_modes from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN BEGIN
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes
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
        )
    ) ON CONFLICT (id) DO
UPDATE
SET transport_modes = EXCLUDED.transport_modes;
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
            NEW.email,
            'meta_role',
            NEW.raw_user_meta_data->>'role'
        )
    );
RAISE WARNING 'Profile creation failed for user %: %',
NEW.id,
SQLERRM;
END;
RETURN NEW;
END;
$$;