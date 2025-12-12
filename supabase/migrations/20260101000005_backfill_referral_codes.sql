-- Migration: Backfill Referral Codes
DO $$
DECLARE r RECORD;
new_code TEXT;
BEGIN FOR r IN
SELECT id,
    full_name
FROM public.profiles
WHERE referral_code IS NULL LOOP -- Generate unique code
    LOOP new_code := upper(
        substring(
            COALESCE(r.full_name, 'USR')
            from 1 for 3
        )
    ) || upper(
        substring(
            md5(random()::text)
            from 1 for 5
        )
    );
-- Check uniqueness
IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE referral_code = new_code
) THEN
UPDATE public.profiles
SET referral_code = new_code
WHERE id = r.id;
EXIT;
-- Exit loop once updated
END IF;
END LOOP;
END LOOP;
END $$;