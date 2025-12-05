-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
    ('documents', 'documents', false),
    ('branding', 'branding', true) ON CONFLICT (id) DO NOTHING;
-- Policy for Avatars (Public Read, Auth Upload)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name)) [1]
);
-- Policy for Documents (Private Read (Owner/Admin), Auth Upload)
CREATE POLICY "Users can upload their own documents." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can view their own documents." ON storage.objects FOR
SELECT USING (
        bucket_id = 'documents'
        AND (
            auth.uid()::text = (storage.foldername(name)) [1]
            OR EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = auth.uid()
                    AND role = 'admin'
            )
        )
    );
-- Policy for Branding (Public Read, Admin Upload)
CREATE POLICY "Branding assets are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'branding');
CREATE POLICY "Admins can upload branding assets." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'branding'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can update branding assets." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'branding'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can delete branding assets." ON storage.objects FOR DELETE USING (
    bucket_id = 'branding'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);