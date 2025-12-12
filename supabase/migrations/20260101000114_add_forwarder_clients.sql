-- Create forwarder_clients table
CREATE TABLE IF NOT EXISTS public.forwarder_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forwarder_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(forwarder_id, client_id)
);
-- Enable RLS
ALTER TABLE public.forwarder_clients ENABLE ROW LEVEL SECURITY;
-- Policies
-- Forwarders can view their own client list
CREATE POLICY "Forwarders can view their own clients" ON public.forwarder_clients FOR
SELECT USING (auth.uid() = forwarder_id);
-- Forwarders can add clients for themselves
CREATE POLICY "Forwarders can add clients" ON public.forwarder_clients FOR
INSERT WITH CHECK (auth.uid() = forwarder_id);
-- Forwarders can remove clients
CREATE POLICY "Forwarders can remove clients" ON public.forwarder_clients FOR DELETE USING (auth.uid() = forwarder_id);