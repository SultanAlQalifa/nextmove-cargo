-- Add country_code column if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'locations'
        AND column_name = 'country_code'
) THEN
ALTER TABLE locations
ADD COLUMN country_code VARCHAR(2);
END IF;
END $$;
-- Update existing locations with ISO codes
UPDATE locations
SET country_code = 'CN'
WHERE name ILIKE '%China%'
    OR name ILIKE '%Chine%';
UPDATE locations
SET country_code = 'SN'
WHERE name ILIKE '%Senegal%'
    OR name ILIKE '%Sénégal%';
UPDATE locations
SET country_code = 'TR'
WHERE name ILIKE '%Turkey%'
    OR name ILIKE '%Turquie%';
UPDATE locations
SET country_code = 'FR'
WHERE name ILIKE '%France%';
UPDATE locations
SET country_code = 'AE'
WHERE name ILIKE '%Dubai%'
    OR name ILIKE '%Emirates%'
    OR name ILIKE '%Émirats%';
UPDATE locations
SET country_code = 'US'
WHERE name ILIKE '%United States%'
    OR name ILIKE '%États-Unis%'
    OR name ILIKE '%USA%';