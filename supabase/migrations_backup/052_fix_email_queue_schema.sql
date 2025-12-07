-- Fix for missing updated_at column in email_queue
-- This explicitly adds the column if it was missed during initial table creation
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'email_queue'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE public.email_queue
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
END IF;
END $$;
-- Reload PostgREST schema cache to ensure the API sees the new column
NOTIFY pgrst,
'reload config';