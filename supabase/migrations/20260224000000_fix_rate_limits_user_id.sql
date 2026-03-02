-- Fix rate_limits table schema: user_id column missing
-- This resolves the 42703 error "column user_id does not exist" when creating RFQs
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'user_id'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
END IF;
END $$;