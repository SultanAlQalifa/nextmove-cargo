-- ====================================================================
-- SECURITY HARDENING: FINAL FIX (Double Casting for ENUM)
-- ====================================================================
BEGIN;
-- 1. ENFORCE ROLE CONSTRAINTS
-- We must cast to text to clean it, then back to ::user_role to save it
UPDATE public.profiles
SET role = LOWER(TRIM(role::text))::user_role;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_role;
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_role CHECK (
        role IN ('client', 'forwarder', 'admin', 'super-admin')
    );
-- 2. ENFORCE STATUS CONSTRAINTS
UPDATE public.profiles
SET account_status = LOWER(TRIM(account_status));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_status;
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_status CHECK (
        account_status IN ('active', 'suspended', 'pending', 'deleted')
    );
-- 3. UPDATED SECURITY SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.sync_user_security_to_auth() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public,
    auth AS $$ BEGIN
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'role',
        NEW.role::text,
        'status',
        NEW.account_status
    )
WHERE id = NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 4. RE-APPLY TRIGGER
DROP TRIGGER IF EXISTS on_user_security_change ON public.profiles;
CREATE TRIGGER on_user_security_change
AFTER
INSERT
    OR
UPDATE OF role,
    account_status ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_user_security_to_auth();
-- 5. FINAL MASS SYNC (126 Users)
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'role',
        p.role::text,
        'status',
        p.account_status
    )
FROM public.profiles p
WHERE u.id = p.id;
COMMIT;
-- FINAL AUDIT
SELECT COUNT(*) as total_utilisateurs,
    SUM(
        CASE
            WHEN role = 'forwarder' THEN 1
            ELSE 0
        END
    ) as prestataires,
    SUM(
        CASE
            WHEN account_status = 'active' THEN 1
            ELSE 0
        END
    ) as actifs
FROM public.profiles;