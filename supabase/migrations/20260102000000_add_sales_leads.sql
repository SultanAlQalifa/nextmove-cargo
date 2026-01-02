-- Add Sales Leads Table and Logic
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    query TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    -- new, contacted, converted, closed
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
-- Admins can see all leads
CREATE POLICY "Admins can view all leads" ON public.sales_leads FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
        )
    );
-- Users can only see their own (though they usually won't see this table directly)
CREATE POLICY "Users can view their own leads" ON public.sales_leads FOR
SELECT USING (auth.uid() = user_id);
-- Anyone (authenticated or not) can create a lead via RPC
CREATE OR REPLACE FUNCTION public.create_sales_lead(
        p_query TEXT,
        p_metadata JSONB DEFAULT '{}'::jsonb
    ) RETURNS UUID AS $$
DECLARE v_lead_id UUID;
BEGIN
INSERT INTO public.sales_leads (user_id, query, metadata)
VALUES (auth.uid(), p_query, p_metadata)
RETURNING id INTO v_lead_id;
RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant access to RPC
GRANT EXECUTE ON FUNCTION public.create_sales_lead(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sales_lead(TEXT, JSONB) TO anon;
-- Trigger updated_at
CREATE TRIGGER handle_updated_at_sales_leads BEFORE
UPDATE ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);