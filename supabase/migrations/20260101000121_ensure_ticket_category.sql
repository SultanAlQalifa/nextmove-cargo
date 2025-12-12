-- ═══════════════════════════════════════════════════════════════
-- Fix Tickets Category Schema
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- 1. Ensure type exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ticket_category'
) THEN CREATE TYPE ticket_category AS ENUM ('technical', 'billing', 'shipment', 'other');
END IF;
-- 2. Ensure column exists
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets'
        AND column_name = 'category'
) THEN
ALTER TABLE tickets
ADD COLUMN category ticket_category DEFAULT 'other';
END IF;
-- 3. Verify permissions (grant access to the type if needed, though usually automatic for owner)
-- This is just to force a schema cache refresh on the client side connecting to it.
NOTIFY pgrst,
'reload schema';
END $$;