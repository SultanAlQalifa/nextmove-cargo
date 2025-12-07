-- Add attachments column to email_queue
ALTER TABLE public.email_queue
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
-- Create a storage bucket for email attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users (Admins) can upload
CREATE POLICY "Admins can upload email attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'email-attachments'
        AND public.is_admin()
    );
-- Policy: Everyone can read (since they are sent in emails, public links are easiest)
CREATE POLICY "Public can read email attachments" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'email-attachments');
-- Policy: Admins can delete
CREATE POLICY "Admins can delete email attachments" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'email-attachments'
    AND public.is_admin()
);