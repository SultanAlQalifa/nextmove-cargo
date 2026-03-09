DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT id,
    name
FROM staff_roles LOOP RAISE NOTICE 'Role: % (ID TYPE: %, ID: %)',
    r.name,
    pg_typeof(r.id),
    r.id;
END LOOP;
END $$;