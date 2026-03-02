-- Migration to automatically extract country from phone number prefix
-- 1. Update existing profiles
UPDATE profiles
SET country = CASE
        WHEN phone LIKE '+221%'
        OR phone LIKE '00221%' THEN 'Sénégal'
        WHEN phone LIKE '+223%'
        OR phone LIKE '00223%' THEN 'Mali'
        WHEN phone LIKE '+225%'
        OR phone LIKE '00225%' THEN 'Côte d''Ivoire'
        WHEN phone LIKE '+224%'
        OR phone LIKE '00224%' THEN 'Guinée'
        WHEN phone LIKE '+226%'
        OR phone LIKE '00226%' THEN 'Burkina Faso'
        WHEN phone LIKE '+227%'
        OR phone LIKE '00227%' THEN 'Niger'
        WHEN phone LIKE '+228%'
        OR phone LIKE '00228%' THEN 'Togo'
        WHEN phone LIKE '+229%'
        OR phone LIKE '00229%' THEN 'Bénin'
        WHEN phone LIKE '+33%'
        OR phone LIKE '0033%' THEN 'France'
        WHEN phone LIKE '+1%'
        OR phone LIKE '001%' THEN 'États-Unis'
        WHEN phone LIKE '+212%'
        OR phone LIKE '00212%' THEN 'Maroc'
        WHEN phone LIKE '+213%'
        OR phone LIKE '00213%' THEN 'Algérie'
        WHEN phone LIKE '+216%'
        OR phone LIKE '00216%' THEN 'Tunisie'
        WHEN phone LIKE '+20%'
        OR phone LIKE '0020%' THEN 'Égypte'
        WHEN phone LIKE '+234%'
        OR phone LIKE '00234%' THEN 'Nigeria'
        WHEN phone LIKE '+237%'
        OR phone LIKE '00237%' THEN 'Cameroun'
        WHEN phone LIKE '+243%'
        OR phone LIKE '00243%' THEN 'Congo RDC'
        ELSE country -- keep original if no match
    END
WHERE phone IS NOT NULL
    AND (
        country IS NULL
        OR country = ''
    );
-- 2. Create function to automatically set country on insert or update
CREATE OR REPLACE FUNCTION public.set_country_from_phone() RETURNS TRIGGER AS $$ BEGIN -- Only update country if it's currently null or empty
    IF NEW.phone IS NOT NULL
    AND (
        NEW.country IS NULL
        OR NEW.country = ''
    ) THEN NEW.country := CASE
        WHEN NEW.phone LIKE '+221%'
        OR NEW.phone LIKE '00221%' THEN 'Sénégal'
        WHEN NEW.phone LIKE '+223%'
        OR NEW.phone LIKE '00223%' THEN 'Mali'
        WHEN NEW.phone LIKE '+225%'
        OR NEW.phone LIKE '00225%' THEN 'Côte d''Ivoire'
        WHEN NEW.phone LIKE '+224%'
        OR NEW.phone LIKE '00224%' THEN 'Guinée'
        WHEN NEW.phone LIKE '+226%'
        OR NEW.phone LIKE '00226%' THEN 'Burkina Faso'
        WHEN NEW.phone LIKE '+227%'
        OR NEW.phone LIKE '00227%' THEN 'Niger'
        WHEN NEW.phone LIKE '+228%'
        OR NEW.phone LIKE '00228%' THEN 'Togo'
        WHEN NEW.phone LIKE '+229%'
        OR NEW.phone LIKE '00229%' THEN 'Bénin'
        WHEN NEW.phone LIKE '+33%'
        OR NEW.phone LIKE '0033%' THEN 'France'
        WHEN NEW.phone LIKE '+1%'
        OR NEW.phone LIKE '001%' THEN 'États-Unis'
        WHEN NEW.phone LIKE '+212%'
        OR NEW.phone LIKE '00212%' THEN 'Maroc'
        WHEN NEW.phone LIKE '+213%'
        OR NEW.phone LIKE '00213%' THEN 'Algérie'
        WHEN NEW.phone LIKE '+216%'
        OR NEW.phone LIKE '00216%' THEN 'Tunisie'
        WHEN NEW.phone LIKE '+20%'
        OR NEW.phone LIKE '0020%' THEN 'Égypte'
        WHEN NEW.phone LIKE '+234%'
        OR NEW.phone LIKE '00234%' THEN 'Nigeria'
        WHEN NEW.phone LIKE '+237%'
        OR NEW.phone LIKE '00237%' THEN 'Cameroun'
        WHEN NEW.phone LIKE '+243%'
        OR NEW.phone LIKE '00243%' THEN 'Congo RDC'
        ELSE NEW.country
    END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. Create Trigger on profiles table
DROP TRIGGER IF EXISTS tr_set_country_from_phone ON public.profiles;
CREATE TRIGGER tr_set_country_from_phone BEFORE
INSERT
    OR
UPDATE OF phone,
    country ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_country_from_phone();