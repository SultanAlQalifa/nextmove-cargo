-- Fix Supabase Linter Warnings for mutable search_paths
-- Warning: 0011_function_search_path_mutable
-- 1. Fix is_admin search_path
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- 2. Fix set_country_from_phone search_path
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
$$ LANGUAGE plpgsql
SET search_path = public;