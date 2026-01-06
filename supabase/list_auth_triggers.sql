SELECT tgname, proname, tgenabled, tgisinternal 
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE tgrelid = 'auth.users'::regclass;
