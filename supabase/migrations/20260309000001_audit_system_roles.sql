-- ═══════════════════════════════════════════════════════════════
-- ROLE AUDIT SYSTEM
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.audit_role_discrepancies() RETURNS TABLE (
        user_id UUID,
        email TEXT,
        profile_role TEXT,
        auth_metadata_role TEXT,
        discrepancy_type TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT p.id as user_id,
    p.email,
    p.role::text as profile_role,
    (u.raw_user_meta_data->>'role')::text as auth_metadata_role,
    CASE
        WHEN (u.raw_user_meta_data->>'role') IS NULL THEN 'MISSING_METADATA'
        WHEN p.role::text <> (u.raw_user_meta_data->>'role') THEN 'ROLE_MISMATCH'
        ELSE 'NONE'
    END as discrepancy_type
FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
WHERE (u.raw_user_meta_data->>'role') IS NULL
    OR p.role::text <> (u.raw_user_meta_data->>'role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;