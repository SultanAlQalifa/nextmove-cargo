-- Add attachments column to email_queue
ALTER TABLE public.email_queue
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
-- Create a storage bucket for email attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users (Admins) can upload
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can upload email attachments'
) THEN CREATE POLICY "Admins can upload email attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'email-attachments'
        AND public.is_admin()
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Public can read email attachments'
) THEN CREATE POLICY "Public can read email attachments" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'email-attachments');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can delete email attachments'
) THEN CREATE POLICY "Admins can delete email attachments" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'email-attachments'
    AND public.is_admin()
);
END IF;
END $$;