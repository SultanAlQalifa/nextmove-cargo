-- Fix rate_limits table schema: created_at column missing
-- This resolves the 42703 error "column created_at does not exist" when creating RFQs
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'created_at'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
END IF;
END $$;