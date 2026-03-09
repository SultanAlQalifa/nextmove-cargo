-- Migration to fix admin user status and ensure default is active
-- Rewritten to include explicit type casting for ENUMs (user_role)
-- 1. Fix existing users with 'admin' role (or contained in role name) who are 'pending' or null
-- CAST role to text to use ILIKE
UPDATE public.profiles
SET account_status = 'active'
WHERE (
        role::text ILIKE '%admin%'
        OR role::text = 'support'
        OR role::text = 'support_manager'
    )
    AND (
        account_status IS NULL
        OR account_status = 'pending'
    );
-- 2. Update the handle_new_user trigger to ensure account_status defaults to 'active' if not provided
-- Drop trigger first to avoid dependency errors during function drop
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Drop function to handle any return type changes
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_referred_by UUID;
v_role TEXT;
BEGIN -- 1. Determine Referrer if code is provided
IF NEW.raw_user_meta_data->>'referral_code_used' IS NOT NULL THEN
SELECT id INTO v_referred_by
FROM public.profiles
WHERE referral_code = upper(
        trim(NEW.raw_user_meta_data->>'referral_code_used')
    )
LIMIT 1;
END IF;
-- 2. Determine Role
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
-- 3. Insert or Update Profile
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        transport_modes,
        phone,
        referred_by,
        account_status -- NEW: Explicitly insert status
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(v_role, 'client'),
        -- Handle enum or string
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            'Utilisateur'
        ),
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
        -- Phone number from Auth or Metadata
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        v_referred_by,
        -- NEW: Default to 'active' if metadata doesn't specify 'pending' (client signup usually implies active trial or similar)
        COALESCE(
            NEW.raw_user_meta_data->>'account_status',
            'active'
        )
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
    -- Only update status if the new value is explicitly provided in metadata, otherwise keep existing
    account_status = COALESCE(
        public.profiles.account_status,
        EXCLUDED.account_status
    );
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Log error to debug_logs (assumes table exists)
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
RETURN NEW;
END;
$$;
-- Ensure trigger exists
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();