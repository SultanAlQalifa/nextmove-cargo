-- ====================================================================
-- SAFE REPAIR v4: FIXED AMBIGUOUS COLUMNS
-- ====================================================================
-- 1. FIX HANDLE_NEW_USER (Dependency Safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, email, role, full_name, account_status)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            'Utilisateur'
        ),
        'active'
    ) ON CONFLICT (id) DO
UPDATE
SET role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    account_status = 'active';
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Debug log fallback
BEGIN
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_fail',
        jsonb_build_object('err', SQLERRM)
    );
EXCEPTION
WHEN OTHERS THEN NULL;
END;
RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. UPDATE CORE HELPERS (IN-PLACE)
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
SELECT role::text
FROM public.profiles
WHERE id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public STABLE AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role::text IN ('admin', 'super-admin')
    );
$$;
-- 3. REMOVE GHOST OVERLOADS (CORRECTED SYNTAX)
DO $$
DECLARE r RECORD;
BEGIN -- Fix: Explicitly alias pg_proc as p and select p.oid to avoid ambiguity
FOR r IN (
    SELECT p.oid::regprocedure as signature
    FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
        AND p.proname IN ('is_admin', 'get_my_role')
        AND p.pronargs > 0 -- Only target those WITH arguments
) LOOP BEGIN EXECUTE 'DROP FUNCTION ' || r.signature;
RAISE NOTICE 'Dropped overloaded function: %',
r.signature;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not drop overload %: %',
r.signature,
SQLERRM;
END;
END LOOP;
END $$;
-- 4. CLEAN BROKEN VIEWS
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema IN ('public')
) LOOP BEGIN EXECUTE format(
    'SELECT 1 FROM %I.%I LIMIT 0',
    r.table_schema,
    r.table_name
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Dropping broken view: %.%',
r.table_schema,
r.table_name;
EXECUTE format(
    'DROP VIEW %I.%I CASCADE',
    r.table_schema,
    r.table_name
);
END;
END LOOP;
END $$;
-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'SAFE REPAIR v4 COMPLETE. Try logging in.' as status;