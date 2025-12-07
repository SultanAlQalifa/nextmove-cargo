-- Allow users to insert their own notifications (required for the "Test" button)
CREATE POLICY "Users can insert own notifications" ON notifications FOR
INSERT WITH CHECK (auth.uid() = user_id);