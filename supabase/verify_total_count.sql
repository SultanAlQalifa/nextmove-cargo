-- ====================================================================
-- VERIFY TOTAL COUNTS (No LIMIT)
-- ====================================================================
SELECT COUNT(*) as total_profiles,
    COUNT(u.id) as total_auth_users,
    SUM(
        CASE
            WHEN p.role::text = (u.raw_user_meta_data->>'role') THEN 1
            ELSE 0
        END
    ) as synced_ok,
    SUM(
        CASE
            WHEN p.role::text != (u.raw_user_meta_data->>'role')
            OR (u.raw_user_meta_data->>'role') IS NULL THEN 1
            ELSE 0
        END
    ) as mismatch
FROM public.profiles p
    JOIN auth.users u ON p.id = u.id;
-- Show breakdown by role
SELECT role,
    count(*) as count
FROM public.profiles
GROUP BY role;