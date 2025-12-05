-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Messaging System
-- Phase 2: Real-time Chat
-- ═══════════════════════════════════════════════════════════════
-- ═══ TABLES ═══
-- 1. Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB -- For context like { rfq_id: "..." }
);
-- 2. Conversation Participants
CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_read_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);
-- 3. Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    -- Deprecated in favor of last_read_at, but kept for simple checks
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- ═══ INDEXES ═══
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
-- ═══ RLS POLICIES ═══
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Conversations: Visible if you are a participant
CREATE POLICY "Users can view conversations they are part of" ON conversations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_participants cp
            WHERE cp.conversation_id = conversations.id
                AND cp.user_id = auth.uid()
        )
    );
-- Participants: Visible if you are a participant in the SAME conversation
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
                AND cp.user_id = auth.uid()
        )
    );
-- Messages: Visible if you are a participant in the conversation
CREATE POLICY "Users can view messages of their conversations" ON messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
                AND cp.user_id = auth.uid()
        )
    );
-- Messages: Insert if you are a participant
CREATE POLICY "Users can send messages to their conversations" ON messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
                AND cp.user_id = auth.uid()
        )
    );
-- ═══ REALTIME ═══
-- Enable Realtime for these tables
alter publication supabase_realtime
add table messages;
alter publication supabase_realtime
add table conversations;