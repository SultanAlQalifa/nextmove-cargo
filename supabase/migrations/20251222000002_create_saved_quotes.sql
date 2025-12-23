-- Create saved_quotes table
CREATE TABLE IF NOT EXISTS saved_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    quote_details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted'))
);
-- RLS Policies
ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
-- Admins can view all
CREATE POLICY "Admins can view all saved quotes" ON saved_quotes FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = auth.uid()
                AND role = 'admin'
        )
    );
-- Users can view their own
CREATE POLICY "Users can view own saved quotes" ON saved_quotes FOR
SELECT USING (auth.uid() = user_id);
-- Anyone can insert (for guest quotes)
CREATE POLICY "Anyone can insert saved quotes" ON saved_quotes FOR
INSERT WITH CHECK (true);