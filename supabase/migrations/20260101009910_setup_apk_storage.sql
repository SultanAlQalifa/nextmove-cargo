-- Migration to setup storage for Mobile App distribution
-- Creates (if possible in SQL) and secures the 'apks' bucket
-- Note: In Supabase, buckets themselves are often created via the Dashboard 
-- or API, but we can set up the RLS policies in advance.
-- 1. Policies for 'apks' bucket
-- Everyone can read/download the APKs (Public access)
-- Only admins can upload APKs
DO $$ BEGIN -- Check if policies exist before creating
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Public Access for APKs'
) THEN CREATE POLICY "Public Access for APKs" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'apks');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admin Upload APKs'
) THEN CREATE POLICY "Admin Upload APKs" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'apks'
        AND (
            SELECT role
            FROM profiles
            WHERE id = auth.uid()
        ) IN ('admin', 'super-admin')
    );
END IF;
END $$;