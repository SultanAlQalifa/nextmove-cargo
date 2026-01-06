-- ====================================================================
-- POS SCHEMA REPAIR: Missing 'initial_cash' Column
-- ====================================================================
BEGIN;
-- 1. Ensure the column exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pos_sessions'
        AND column_name = 'initial_cash'
) THEN
ALTER TABLE public.pos_sessions
ADD COLUMN initial_cash DECIMAL(15, 2) DEFAULT 0;
END IF;
END $$;
-- 2. Confirm other essential columns for POS
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pos_sessions'
        AND column_name = 'total_sales'
) THEN
ALTER TABLE public.pos_sessions
ADD COLUMN total_sales DECIMAL(15, 2) DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pos_sessions'
        AND column_name = 'sales_count'
) THEN
ALTER TABLE public.pos_sessions
ADD COLUMN sales_count INTEGER DEFAULT 0;
END IF;
END $$;
-- 3. FORCE POSTGREST CACHE REFRESH (The "Nuclear" way)
-- We've done this before, but let's do it again specifically for this schema.
NOTIFY pgrst,
'reload schema';
COMMIT;
-- VERIFICATION
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'pos_sessions'
    AND column_name IN ('initial_cash', 'total_sales', 'sales_count');