-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
    ('documents', 'documents', false),
    ('branding', 'branding', true) ON CONFLICT (id) DO NOTHING;
-- Policy for Avatars (Public Read, Auth Upload)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Avatar images are publicly accessible.'
) THEN CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can upload their own avatar.'
) THEN CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (
            select auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can update their own avatar.'
) THEN CREATE POLICY "Users can update their own avatar." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND (
            select auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can delete their own avatar.'
) THEN CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND (
        select auth.uid()
    )::text = (storage.foldername(name)) [1]
);
END IF;
END $$;
-- Policy for Documents (Private Read (Owner/Admin), Auth Upload)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can upload their own documents.'
) THEN CREATE POLICY "Users can upload their own documents." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'documents'
        AND (
            select auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can view their own documents.'
) THEN CREATE POLICY "Users can view their own documents." ON storage.objects FOR
SELECT USING (
        bucket_id = 'documents'
        AND (
            (
                select auth.uid()
            )::text = (storage.foldername(name)) [1]
            OR EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE id = (
                        select auth.uid()
                    )
                    AND role = 'admin'
            )
        )
    );
END IF;
END $$;
-- Policy for Branding (Public Read, Admin Upload)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Branding assets are publicly accessible.'
) THEN CREATE POLICY "Branding assets are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'branding');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can upload branding assets.'
) THEN CREATE POLICY "Admins can upload branding assets." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'branding'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
                AND role = 'admin'
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can update branding assets.'
) THEN CREATE POLICY "Admins can update branding assets." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'branding'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
                AND role = 'admin'
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can delete branding assets.'
) THEN CREATE POLICY "Admins can delete branding assets." ON storage.objects FOR DELETE USING (
    bucket_id = 'branding'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
            AND role = 'admin'
    )
);
END IF;
END $$;