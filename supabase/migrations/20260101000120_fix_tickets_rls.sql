-- ═══════════════════════════════════════════════════════════════
-- Fix Support Tickets RLS Policies (Comprehensive)
-- ═══════════════════════════════════════════════════════════════
-- 1. Ensure RLS is enabled
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
-- 2. Drop Potentially Conflicting/Outdated Policies on TICKETS
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can view assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can view all tickets" ON tickets;
-- From 007
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
-- From 007
DROP POLICY IF EXISTS "Staff can update tickets" ON tickets;
-- From 007
-- 3. Create Clean, Comprehensive Policies for TICKETS
-- SELECT: Users see their own (creator) or assigned (agent) tickets.
-- Admins/Support see ALL.
CREATE POLICY "view_tickets_policy" ON tickets FOR
SELECT USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- INSERT: Authenticated users can create tickets for themselves.
CREATE POLICY "create_tickets_policy" ON tickets FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE: Users can update their own tickets (e.g., Close them).
-- Admins/Support can update any ticket.
CREATE POLICY "update_tickets_policy" ON tickets FOR
UPDATE USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- DELETE: Only Admins can delete tickets.
CREATE POLICY "delete_tickets_policy" ON tickets FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- 4. Drop Potentially Conflicting/Outdated Policies on MESSAGES
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Staff can view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users and Staff can send messages" ON ticket_messages;
-- 5. Create Clean, Comprehensive Policies for MESSAGES
-- SELECT: If you can see the ticket, you can see the messages.
CREATE POLICY "view_messages_policy" ON ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM tickets
            WHERE id = ticket_messages.ticket_id
                AND (
                    user_id = auth.uid()
                    OR assigned_to = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM profiles
                        WHERE id = auth.uid()
                            AND role IN ('admin', 'super-admin')
                    )
                )
        )
    );
-- INSERT: If you can see the ticket, you can add a message.
-- (Sender ID must match auth user)
CREATE POLICY "create_messages_policy" ON ticket_messages FOR
INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM tickets
            WHERE id = ticket_messages.ticket_id
                AND (
                    user_id = auth.uid()
                    OR assigned_to = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM profiles
                        WHERE id = auth.uid()
                            AND role IN ('admin', 'super-admin')
                    )
                )
        )
    );