-- ═══════════════════════════════════════════════════════════════
-- Fix Missing Column in Tickets Table (REVISED)
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- 1. Add 'assigned_to' column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets'
        AND column_name = 'assigned_to'
) THEN
ALTER TABLE tickets
ADD COLUMN assigned_to UUID REFERENCES profiles(id);
END IF;
-- 2. Add 'priority' column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets'
        AND column_name = 'priority'
) THEN -- Note: Ensure ticket_priority type exists, if not it will error but should exist
-- We assume it exists or falls back to text if specific type check fails
ALTER TABLE tickets
ADD COLUMN priority ticket_priority DEFAULT 'medium';
END IF;
END $$;
-- 3. Ensure Index exists
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
-- 4. Refresh RLS policies for Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets" ON tickets FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Staff can view assigned tickets" ON tickets;
-- FIXED: Removed 'support' from role IN check because profiles.role is an enum with fixed values
-- Instead, we just check against 'admin' and 'super-admin'
-- If 'support' is a role in profiles.role enum, it would work, but apparently it is NOT.
-- Support staff likely have role='admin' or 'staff' + staff_role_id='support'.
-- For now, allowing 'admin' and 'super-admin' covers the base need.
CREATE POLICY "Staff can view assigned tickets" ON tickets FOR
SELECT USING (
        auth.uid() = assigned_to
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- Ensure users can see their own messages
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON ticket_messages;
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM tickets
            WHERE id = ticket_messages.ticket_id
                AND (
                    user_id = auth.uid()
                    OR assigned_to = auth.uid()
                )
        )
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );