-- Check Storage Bucket Privacy
-- Supabase stores bucket config in storage.buckets
SELECT id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;