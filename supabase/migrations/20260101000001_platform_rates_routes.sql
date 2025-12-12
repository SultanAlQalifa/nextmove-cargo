-- ROBUST MIGRATION: Route-Based Platform Rates
-- Safe to run multiple times (Idempotent)
DO $$ BEGIN -- 1. Ensure Columns Exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'platform_rates'
        AND column_name = 'origin_id'
) THEN
ALTER TABLE platform_rates
ADD COLUMN origin_id UUID;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'platform_rates'
        AND column_name = 'destination_id'
) THEN
ALTER TABLE platform_rates
ADD COLUMN destination_id UUID;
END IF;
-- 2. Drop Old Constraints (if they exist, to ensure we start fresh)
-- Drop old unique constraint if it exists
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_rates_mode_type_key'
) THEN
ALTER TABLE platform_rates DROP CONSTRAINT platform_rates_mode_type_key;
END IF;
-- Drop potential FKs (to upgrade them to CASCADE)
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_rates_origin_id_fkey'
) THEN
ALTER TABLE platform_rates DROP CONSTRAINT platform_rates_origin_id_fkey;
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_rates_destination_id_fkey'
) THEN
ALTER TABLE platform_rates DROP CONSTRAINT platform_rates_destination_id_fkey;
END IF;
END $$;
-- 3. Apply Strict Constraints (CASCADE)
ALTER TABLE platform_rates
ADD CONSTRAINT platform_rates_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES locations(id) ON DELETE CASCADE;
ALTER TABLE platform_rates
ADD CONSTRAINT platform_rates_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES locations(id) ON DELETE CASCADE;
-- 4. Apply New Unique Index (Global aware)
DROP INDEX IF EXISTS platform_rates_unique_route;
CREATE UNIQUE INDEX platform_rates_unique_route ON platform_rates (
    mode,
    type,
    COALESCE(
        origin_id,
        '00000000-0000-0000-0000-000000000000'
    ),
    COALESCE(
        destination_id,
        '00000000-0000-0000-0000-000000000000'
    )
);