
SELECT 
    n.nspname as schema,
    p.proname as function,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proowner::regrole as owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('is_admin', 'get_my_role', 'handle_new_user')
AND n.nspname = 'public';

SELECT 
    tgname, 
    tgrelid::regclass,
    tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

