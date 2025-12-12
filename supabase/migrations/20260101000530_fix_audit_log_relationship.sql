-- Fix Audit Log Relationship for PostgREST
-- PostgREST cannot easily join 'auth.users' (hidden schema) directly. 
-- We must point the Foreign Key to 'public.profiles' to allow frontend joins.
BEGIN;
-- 1. Drop existing FK if it exists (assuming standard naming or previous migration)
-- We wrap in anonymous block or just use IF EXISTS if possible, but standard SQL 'DROP CONSTRAINT IF EXISTS' works in Postgres.
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_changed_by_fkey;
-- 2. Add new FK to public.profiles
-- Note: profiles.id matches auth.users.id, so data integrity is maintained.
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_changed_by_profiles_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE
SET NULL;
COMMIT;