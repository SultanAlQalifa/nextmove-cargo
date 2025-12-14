-- Migration to add type to fund_calls if not exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'fund_calls'
        AND column_name = 'type'
) THEN
ALTER TABLE fund_calls
ADD COLUMN type text DEFAULT 'withdrawal';
END IF;
END $$;