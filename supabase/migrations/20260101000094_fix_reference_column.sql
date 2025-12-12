-- FIX COLUMN NAME
-- Ensures the column is named 'reference' to match the code.
DO $$ BEGIN -- Check if 'reference_id' exists and 'reference' does NOT exist
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'reference_id'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'reference'
) THEN
ALTER TABLE transactions
    RENAME COLUMN reference_id TO reference;
RAISE NOTICE 'Renamed reference_id to reference';
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'reference'
) THEN RAISE NOTICE 'Column reference already exists. No change needed.';
ELSE RAISE NOTICE 'Weird state: neither reference nor reference_id found?';
END IF;
END $$;