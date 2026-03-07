-- Migration: Fix RLS for company_expenses and update is_admin function
-- Description: Ensures super-admin and admin roles can manage expenses
-- 1. Update is_admin() to be inclusive of super-admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Standardize company_expenses policies (Pattern from 077_fix_rls_total_reset.sql)
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.company_expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.company_expenses;
-- Match "Standard_" naming convention
DROP POLICY IF EXISTS "Standard_Select" ON public.company_expenses;
CREATE POLICY "Standard_Select" ON public.company_expenses FOR
SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Standard_Insert" ON public.company_expenses;
CREATE POLICY "Standard_Insert" ON public.company_expenses FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Standard_Update" ON public.company_expenses;
CREATE POLICY "Standard_Update" ON public.company_expenses FOR
UPDATE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Standard_Delete" ON public.company_expenses;
CREATE POLICY "Standard_Delete" ON public.company_expenses FOR DELETE TO authenticated USING (public.is_admin());