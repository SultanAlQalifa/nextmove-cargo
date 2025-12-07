-- ═══════════════════════════════════════════════════════════════
-- Fix: Infinite Recursion in Messaging RLS
-- ═══════════════════════════════════════════════════════════════
-- 1. Create a secure function to check participation (Bypasses RLS)
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = conversation_uuid
            AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Fix CONVERSATIONS Policy
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations;
CREATE POLICY "Users can view conversations they are part of" ON conversations FOR
SELECT USING (is_conversation_participant(id));
-- 3. Fix CONVERSATION_PARTICIPANTS Policy (The Loop Source)
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR
SELECT USING (
        is_conversation_participant(conversation_id)
    );
-- 4. Fix MESSAGES Policies
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON messages;
CREATE POLICY "Users can view messages of their conversations" ON messages FOR
SELECT USING (
        is_conversation_participant(conversation_id)
    );
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages FOR
INSERT WITH CHECK (
        is_conversation_participant(conversation_id)
    );