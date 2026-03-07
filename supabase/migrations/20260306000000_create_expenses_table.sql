-- Migration: Create company_expenses table
-- Description: Track business expenses for administrators
CREATE TABLE IF NOT EXISTS public.company_expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.profiles(id),
    date timestamptz NOT NULL DEFAULT now(),
    merchant text NOT NULL,
    article text,
    amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    currency text NOT NULL DEFAULT 'XOF',
    category text DEFAULT 'other',
    payment_method text,
    receipt_url text,
    raw_content text,
    status text DEFAULT 'cleared',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- RLS Policies
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;
-- Only admins can see and manage expenses
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.company_expenses;
CREATE POLICY "Admins can view all expenses" ON public.company_expenses FOR
SELECT USING (
        (
            select auth.uid()
        ) IN (
            SELECT id
            FROM public.profiles
            WHERE role IN ('admin', 'super-admin')
        )
    );
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.company_expenses;
CREATE POLICY "Admins can manage expenses" ON public.company_expenses FOR ALL USING (
    (
        select auth.uid()
    ) IN (
        SELECT id
        FROM public.profiles
        WHERE role IN ('admin', 'super-admin')
    )
) WITH CHECK (
    (
        select auth.uid()
    ) IN (
        SELECT id
        FROM public.profiles
        WHERE role IN ('admin', 'super-admin')
    )
);
-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.company_expenses;
CREATE TRIGGER set_expenses_updated_at BEFORE
UPDATE ON public.company_expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();