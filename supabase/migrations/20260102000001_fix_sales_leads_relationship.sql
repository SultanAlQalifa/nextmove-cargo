-- Ensure the relationship for Supabase joins
ALTER TABLE IF EXISTS public.sales_leads DROP CONSTRAINT IF EXISTS sales_leads_user_id_fkey;
ALTER TABLE public.sales_leads
ADD CONSTRAINT sales_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE
SET NULL;
-- Ensure RLS is fully functional for admins
DROP POLICY IF EXISTS "Admins can view all leads" ON public.sales_leads;
CREATE POLICY "Admins can view all leads" ON public.sales_leads FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);