-- Enable Realtime for Notifications
-- usage: supabase_realtime publication must include this table.
BEGIN;
-- 1. Ensure table is part of the publication (if supabase_realtime exists)
-- In Supabase, usually adding the table to the publication 'supabase_realtime' is enough.
-- But first we ensure the publication exists (standard Supabase setup) and add the table.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND tablename = 'notifications'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
END IF;
END $$;
COMMIT;