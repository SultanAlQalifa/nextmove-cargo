-- ═══════════════════════════════════════════════════════════════
-- DRACONIAN ROLE SECURITY (v1)
-- 1. Sync Role MetaData to Auth (Prevents metadata override bugs)
-- 2. Strict Subscription/Role Integrity
-- 3. Hardened Super-Admin Lockdown
-- ═══════════════════════════════════════════════════════════════
-- 1. Function to Sync Role to Auth Metadata
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth() RETURNS TRIGGER AS $$ BEGIN -- Update the auth.users table's raw_user_meta_data
    -- We append/override the 'role' key
UPDATE auth.users
SET raw_user_meta_data = CASE
        WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', NEW.role::text)
        ELSE raw_user_meta_data || jsonb_build_object('role', NEW.role::text)
    END
WHERE id = NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger for Sync
DROP TRIGGER IF EXISTS tr_sync_role_to_auth ON public.profiles;
CREATE TRIGGER tr_sync_role_to_auth
AFTER
INSERT
    OR
UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();
-- 2. DRACONIAN INTEGRITY FUNCTION
CREATE OR REPLACE FUNCTION public.enforce_draconian_role_integrity() RETURNS TRIGGER AS $$
DECLARE v_has_active_sub BOOLEAN;
v_master_email TEXT := 'wandifaproperties@gmail.com';
-- HARDCODED CORE MASTER
BEGIN -- [A] SUPER-ADMIN LOCKDOWN
IF NEW.role = 'super-admin'
AND NEW.email <> v_master_email THEN RAISE EXCEPTION 'SECURITY BREACH: Attempt to assign super-admin to unauthorized email (%). Access Denied.',
NEW.email;
END IF;
-- [B] ADMIN/STAFF LOCKDOWN
-- Only allow specific emails for 'admin' if not super-admin
IF NEW.role = 'admin'
AND NEW.email NOT IN (
    v_master_email,
    'khadidiatoudiop053@gmail.com',
    'afriflux@gmail.com',
    'sultanalqalifa@gmail.com'
) THEN RAISE EXCEPTION 'SECURITY BREACH: Unauthorized administrative role requested for %. Locked.',
NEW.email;
END IF;
-- [C] FORWARDER/SUBSCRIPTION SYNC
-- If role is forwarder, must have a record in user_subscriptions with status='active'
IF NEW.role = 'forwarder' THEN
SELECT EXISTS (
        SELECT 1
        FROM public.user_subscriptions
        WHERE user_id = NEW.id
            AND status = 'active'
    ) INTO v_has_active_sub;
IF NOT v_has_active_sub
AND NEW.account_status = 'active' THEN -- We don't block the update yet, but we force subscription_status to inactive if it was falsy
-- Or better: Raise error if they try to SET it to active without sub
IF TG_OP = 'UPDATE'
AND OLD.role <> 'forwarder' THEN -- Allow the transition but ensure subscription_status is synced
NEW.subscription_status := 'inactive';
END IF;
END IF;
END IF;
-- [D] NO SILENT DEFAULTS
-- Role must be one of the valid enums, never null
IF NEW.role IS NULL THEN NEW.role := 'client'::user_role;
-- Safe fallback but we prefer it never happens
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger for Integrity
DROP TRIGGER IF EXISTS tr_draconian_role_integrity ON public.profiles;
CREATE TRIGGER tr_draconian_role_integrity BEFORE
INSERT
    OR
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_draconian_role_integrity();
-- 3. CLEANUP: Ensure existing metadata is synced
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT id,
    role
FROM public.profiles LOOP
UPDATE auth.users
SET raw_user_meta_data = CASE
        WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', r.role::text)
        ELSE raw_user_meta_data || jsonb_build_object('role', r.role::text)
    END
WHERE id = r.id;
END LOOP;
END $$;