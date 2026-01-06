-- ====================================================================
-- REFINED REPAIR SCRIPT (Safe & Targeted)
-- ====================================================================
-- 1. FIX handle_new_user TRIGGER (CRITICAL SYNTAX FIX)
-- The previous version had 9 columns but 10 values, which causes a 500 error in Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_referred_by UUID;
v_role TEXT;
BEGIN -- Determine Referrer (Only if column exists to be safe)
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
-- Determine Role
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
-- Insert or Update Profile
INSERT INTO public.profiles (
        id,
        email,
        role,
        full_name,
        avatar_url,
        phone,
        referred_by,
        account_status
    )
VALUES (
        NEW.id,
        NEW.email,
        v_role,
        -- This will be auto-cast to user_role if it's an enum
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            'Utilisateur'
        ),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        v_referred_by,
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
    account_status = COALESCE(
        public.profiles.account_status,
        EXCLUDED.account_status
    );
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Fallback anti-crash : Log error and allow AUTH to proceed
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'debug_logs'
) THEN
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_error',
        jsonb_build_object('error', SQLERRM, 'user', NEW.id)
    );
END IF;
RETURN NEW;
END;
$$;
-- 2. ENSURE ENUM VALUES (If column is an enum, we must ensure 'support', 'manager', 'driver' exist)
DO $$ BEGIN -- Check if user_role enum exists
IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
) THEN -- Add missing values if they don't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'support'
        AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'user_role'
        )
) THEN ALTER TYPE user_role
ADD VALUE 'support';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'manager'
        AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'user_role'
        )
) THEN ALTER TYPE user_role
ADD VALUE 'manager';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'driver'
        AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'user_role'
        )
) THEN ALTER TYPE user_role
ADD VALUE 'driver';
END IF;
END IF;
END $$;
-- 3. RELOAD SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'FIX APPLIED. Please try to log in again.' as status;