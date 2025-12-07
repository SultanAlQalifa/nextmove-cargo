-- Allow users to create their own transactions
CREATE POLICY "Users can create own transactions" ON transactions FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);