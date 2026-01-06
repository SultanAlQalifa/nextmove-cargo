-- ====================================================================
-- MASS SYNC & AUTOMATION RESTORE (Fixed Type Casting)
-- ====================================================================
BEGIN;
-- 1. BULK SYNC (The "General Rule")
-- Update metadata for EVERY user in the system to match their public profile role
-- Added ::text cast to fix "operator does not exist" error
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role::text)
FROM public.profiles p
WHERE u.id = p.id
    AND (
        u.raw_user_meta_data->>'role' IS DISTINCT
        FROM p.role::text
    );
-- 2. RESTORE AUTOMATION (The "D'office" Rule)
-- Create a safe function to sync Profile updates -> Auth Metadata
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public,
    auth AS $$ BEGIN -- Cast NEW.role to text for comparison and JSON storage
    IF NEW.role::text IS DISTINCT
FROM OLD.role::text THEN
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role::text)
WHERE id = NEW.id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. RE-ENABLE TRIGGER
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
AFTER
UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();
COMMIT;
-- 4. VERIFY RESULTS (Show updated rows)
SELECT p.email,
    p.role as profile_role,
    u.raw_user_meta_data->>'role' as auth_role,
    CASE
        WHEN p.role::text = (u.raw_user_meta_data->>'role') THEN 'OK'
        ELSE 'MISMATCH'
    END as status
FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
ORDER BY status ASC,
    p.email
LIMIT 10;