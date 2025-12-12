-- ═══════════════════════════════════════════════════════════════
-- Ensure Common Locations Exist
-- Fixed: Removed non-existent 'country_code' column
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE loc_name text;
BEGIN -- List of required locations
FOREACH loc_name IN ARRAY ARRAY ['Senegal', 'China', 'France', 'Turkey', 'United Arab Emirates', 'Dubai', 'Sénégal', 'Chine', 'Sénégal (SN)', 'Chine (CN)'] LOOP IF NOT EXISTS (
    SELECT 1
    FROM locations
    WHERE name = loc_name
) THEN
INSERT INTO locations (name, type, status)
VALUES (
        loc_name,
        'country',
        'active'
    );
END IF;
END LOOP;
END $$;