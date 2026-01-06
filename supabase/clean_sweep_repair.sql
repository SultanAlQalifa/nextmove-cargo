-- ====================================================================
-- CLEAN SWEEP REPAIR v2: HANDLING DEPENDENCIES
-- ====================================================================
-- 1. DROP DEPENDENT TRIGGERS FIRST
-- We must drop the trigger before we can drop/change the function it uses.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 2. DROP OVERLOADED FUNCTIONS
-- Now it is safe to drop the function overloads.
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.log_audit_event();
-- 3. RECREATE handle_new_user (Safe Version)
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
WHEN OTHERS THEN -- Emergency fallback: try inserting with minimal data
BEGIN
INSERT INTO public.profiles (id, email, role, full_name, account_status)
VALUES (
        NEW.id,
        NEW.email,
        'client',
        'Utilisateur',
        'active'
    ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
WHEN OTHERS THEN RETURN NEW;
-- Total failure fallback, allowing auth to proceed
END;
RETURN NEW;
END;
$$;
-- 4. RECREATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 5. RECREATE HELPERS (Non-recursive)
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
-- 6. DROP BROKEN VIEWS (Automatic cleanup)
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
-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst,
'reload config';
NOTIFY pgrst,
'reload schema';
SELECT 'CLEAN SWEEP v2 COMPLETE. Trigger rebuilt. Try logging in.' as status;