-- ═══════════════════════════════════════════════════════════════
-- REPAIR AND SYNC PROFILES (v1)
-- 1. Sync phone from auth.users (phone column or metadata)
-- 2. Sync full_name from metadata if current is 'User' or NULL
-- 3. Fix handle_new_user trigger to include phone for future users
-- ═══════════════════════════════════════════════════════════════
-- [1] DATA REPAIR: Sync existing profiles
UPDATE public.profiles p
SET phone = COALESCE(
        NULLIF(p.phone, ''),
        u.phone,
        u.raw_user_meta_data->>'phone'
    ),
    full_name = CASE
        WHEN p.full_name IS NULL
        OR p.full_name = 'User'
        OR p.full_name = '' THEN COALESCE(u.raw_user_meta_data->>'full_name', p.full_name)
        ELSE p.full_name
    END
FROM auth.users u
WHERE p.id = u.id;
-- [2] TRIGGER REPAIR: Ensure phone is captured on signup for future users
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        phone,
        account_status
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        'active'::account_status
    ) ON CONFLICT (id) DO
UPDATE
SET phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
RETURN NEW;
END;
$$;