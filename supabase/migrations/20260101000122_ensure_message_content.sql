-- ═══════════════════════════════════════════════════════════════
-- Fix Ticket Messages Schema Cache
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- 1. Ensure 'content' column exists in 'ticket_messages'
-- If it was somehow named 'message', we'll rename it or create 'content'.
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'message'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'content'
) THEN
ALTER TABLE ticket_messages
    RENAME COLUMN message TO content;
END IF;
-- If neither exists (unlikely if table exists), ensure 'content' is added
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'content'
) THEN
ALTER TABLE ticket_messages
ADD COLUMN content TEXT NOT NULL DEFAULT '';
END IF;
-- 2. Force Schema Cache Reload
NOTIFY pgrst,
'reload schema';
END $$;