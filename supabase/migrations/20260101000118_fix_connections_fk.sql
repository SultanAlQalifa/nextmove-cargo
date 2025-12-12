-- Fix user_connections Foreign Keys to point to public.profiles instead of auth.users
-- This allows Supabase JS SDK to see the relationship: .select('*, requester:profiles!requester_id(*)')
-- 1. Drop old constraints
ALTER TABLE public.user_connections DROP CONSTRAINT IF EXISTS user_connections_requester_id_fkey;
ALTER TABLE public.user_connections DROP CONSTRAINT IF EXISTS user_connections_recipient_id_fkey;
-- 2. Add new constraints referencing public.profiles
ALTER TABLE public.user_connections
ADD CONSTRAINT user_connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_connections
ADD CONSTRAINT user_connections_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;