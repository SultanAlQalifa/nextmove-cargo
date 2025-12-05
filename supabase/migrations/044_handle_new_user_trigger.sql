-- ═══════════════════════════════════════════════════════════════
-- Automate Profile Creation
-- Replaces client-side profile creation (which fails RLS)
-- with a secure server-side trigger (SECURITY DEFINER).
-- ═══════════════════════════════════════════════════════════════
-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER -- Runs as Superuser, bypassing RLS
SET search_path = public -- Secure search path
    AS $$ BEGIN
INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        -- Default to client
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    ) ON CONFLICT (id) DO NOTHING;
-- Graceful if profile already exists
RETURN NEW;
END;
$$;
-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 3. Cleanup: We can remove the "allow insert/update" policies if we want to be ultra-strict
-- But keeping UPDATE is good for profile editing.
-- Removing INSERT policy is cleaner now that we use the trigger, but harmless to keep.