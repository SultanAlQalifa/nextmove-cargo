-- SECURITY AUDIT: RLS POLICIES
-- Lists all tables and their policies to identify "public" or "unsafe" access.
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename,
    cmd;