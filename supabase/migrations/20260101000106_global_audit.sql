-- Comprehensive RLS Audit
-- Lists all tables in public schema, checking if RLS is enabled
-- And lists any policies that grant access to 'public' or 'anon' roles
WITH table_rls AS (
    SELECT tablename,
        rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
),
public_policies AS (
    SELECT tablename,
        policyname,
        cmd,
        roles
    FROM pg_policies
    WHERE schemaname = 'public'
        AND (
            'public' = ANY(roles)
            OR 'anon' = ANY(roles)
        )
)
SELECT t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as public_policy_count,
    array_agg(p.policyname) as public_policies
FROM table_rls t
    LEFT JOIN public_policies p ON t.tablename = p.tablename
GROUP BY t.tablename,
    t.rowsecurity
ORDER BY rls_enabled ASC,
    public_policy_count DESC;
-- A count of > 0 in public_policy_count warrants immediate investigation.
-- rls_enabled = false is CRITICAL for sensitive tables.