-- ====================================================================
-- COMPREHENSIVE SCHEMA INTEGRITY SCAN
-- ====================================================================
-- 1. IDENTIFY BROKEN VIEWS (Try to describe each view)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT table_schema,
        table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
) LOOP BEGIN EXECUTE format(
    'SELECT * FROM %I.%I LIMIT 0',
    r.table_schema,
    r.table_name
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ BROKEN VIEW FOUND: %.% - Error: %',
r.table_schema,
r.table_name,
SQLERRM;
END;
END LOOP;
END $$;
-- 2. IDENTIFY OVERLOADED FUNCTIONS
-- Overloaded functions (same name, different args) can confuse PostgREST if not handled carefully.
SELECT n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    count(*) OVER (PARTITION BY p.proname) as overload_count
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND count(*) OVER (PARTITION BY p.proname) > 1;
-- 3. CHECK FOR INVALID RETURN TYPES
-- Functions returning non-existent types or deleted table types.
SELECT proname,
    typname as return_type,
    p.prosrc
FROM pg_proc p
    JOIN pg_type t ON p.prorettype = t.oid
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND t.typname = 'record' -- PostgREST sometimes struggles with generic RECORD return without OUT params
    AND p.prokind = 'f';
-- 4. SEARCH FOR 'is_verified' IN ALL SOURCE CODE
-- This column was a major suspect earlier.
SELECT n.nspname as schema,
    p.proname as function_name,
    p.prosrc
FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc ILIKE '%is_verified%'
    AND n.nspname IN ('public', 'auth');
-- 5. CHECK RLS POLICIES FOR BROKEN REFERENCES
-- Sometimes policies refer to columns that were dropped.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT schemaname,
        tablename,
        policyname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP BEGIN -- This is hard to automate perfectly, but we check if the table itself is queryable
EXECUTE format(
    'SELECT 1 FROM %I.%I LIMIT 0',
    r.schemaname,
    r.tablename
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ TABLE WITH POLICY BROKEN: %.% - Error: %',
r.schemaname,
r.tablename,
SQLERRM;
END;
END LOOP;
END $$;
-- 6. CHECK FOR RECENT ERRORS IN debug_logs
SELECT *
FROM public.debug_logs
ORDER BY created_at DESC
LIMIT 10;