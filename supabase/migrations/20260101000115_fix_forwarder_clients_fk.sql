-- Fix Foreign Key pointers to allow PostgREST to detect relationships with 'profiles'
-- Drop existing constraints (referencing auth.users)
ALTER TABLE public.forwarder_clients DROP CONSTRAINT IF EXISTS forwarder_clients_client_id_fkey;
ALTER TABLE public.forwarder_clients DROP CONSTRAINT IF EXISTS forwarder_clients_forwarder_id_fkey;
-- Re-add constraints referencing public.profiles
-- This enables: .select('*, user:profiles!client_id(*)')
ALTER TABLE public.forwarder_clients
ADD CONSTRAINT forwarder_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.forwarder_clients
ADD CONSTRAINT forwarder_clients_forwarder_id_fkey FOREIGN KEY (forwarder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;