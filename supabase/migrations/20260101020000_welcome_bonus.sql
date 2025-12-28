-- Migration: Award 100 Welcome Points to All Users
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT id
FROM public.profiles LOOP -- Update user points
UPDATE public.profiles
SET loyalty_points = COALESCE(loyalty_points, 0) + 100
WHERE id = r.id;
-- Log transaction
PERFORM public.log_point_transaction(
    r.id,
    100,
    'welcome_bonus',
    NULL,
    '{"note": "Cadeau de bienvenue NextMove"}'::jsonb
);
END LOOP;
END $$;