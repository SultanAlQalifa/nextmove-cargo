DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT tgname,
        tgnargs,
        tgtype,
        tgdeferrable,
        tginitdeferred,
        tgisinternal,
        relname,
        nspname,
        tgfoid::regproc as function_name
    FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE relname = 'rfq_requests'
) LOOP RAISE NOTICE 'Trigger: %, Function: %',
r.tgname,
r.function_name;
END LOOP;
END $$;