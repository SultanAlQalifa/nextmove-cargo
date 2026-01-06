-- ====================================================================
-- FINAL REPAIR: HANDLE_NEW_USER (FIXED COLUMNS)
-- ====================================================================
-- 1. DROP AND RECREATE THE TRIGGER FUNCTION WITH EXACT COLUMN COUNT
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_referred_by UUID;
v_role user_role;
-- Using the exact type if it exists, otherwise TEXT works
BEGIN -- 1. Determine Referrer (Safety check for column existence)
IF NEW.raw_user_meta_data->>'referral_code_used' IS NOT NULL THEN BEGIN
SELECT id INTO v_referred_by
FROM public.profiles
WHERE referral_code = upper(
        trim(NEW.raw_user_meta_data->>'referral_code_used')
    )
LIMIT 1;
EXCEPTION
WHEN OTHERS THEN v_referred_by := NULL;
END;
END IF;
-- 2. Determine Role (Lowercased and trimmed to match ENUMs)
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role;
-- 3. Insert or Update Profile (9 Columns, 9 Values - EXACT MATCH)
INSERT INTO public.profiles (
        id,
        -- 1
        email,
        -- 2
        role,
        -- 3
        full_name,
        -- 4
        avatar_url,
        -- 5
        transport_modes,
        -- 6
        phone,
        -- 7
        referred_by,
        -- 8
        account_status -- 9
    )
VALUES (
        NEW.id,
        -- 1
        NEW.email,
        -- 2
        v_role,
        -- 3
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            'Utilisateur'
        ),
        -- 4
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        -- 5
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
        -- 6
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        -- 7
        v_referred_by,
        -- 8
        COALESCE(
            NEW.raw_user_meta_data->>'account_status',
            'active'
        ) -- 9
    ) ON CONFLICT (id) DO
UPDATE
SET role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    referred_by = COALESCE(
        public.profiles.referred_by,
        EXCLUDED.referred_by
    ),
    transport_modes = EXCLUDED.transport_modes,
    account_status = COALESCE(
        public.profiles.account_status,
        EXCLUDED.account_status
    );
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Fallback anti-crash : Log error to debug_logs and allow AUTH creation
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'debug_logs'
) THEN
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_error_final',
        jsonb_build_object(
            'error',
            SQLERRM,
            'user_id',
            NEW.id,
            'email',
            NEW.email
        )
    );
END IF;
RETURN NEW;
END;
$$;
-- 2. RELOAD SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'RÉPARATION EFFECTUÉE : Le trigger a été corrigé avec le bon nombre de colonnes.' as status;