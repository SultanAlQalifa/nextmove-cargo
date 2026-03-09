-- Migration: 058_pos_cash_management
-- Description: Add cash management tables and columns for POS Phase 1
-- 1. Add columns to pos_sessions
ALTER TABLE public.pos_sessions
ADD COLUMN IF NOT EXISTS closing_cash_counted numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS closing_cash_expected numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS closing_difference numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS closing_notes text;
-- 2. Create pos_cash_operations table
CREATE TABLE IF NOT EXISTS public.pos_cash_operations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('in', 'out')),
    amount numeric NOT NULL CHECK (amount > 0),
    reason text NOT NULL,
    created_at timestamptz DEFAULT now()
);
-- 3. Enable RLS on pos_cash_operations
ALTER TABLE public.pos_cash_operations ENABLE ROW LEVEL SECURITY;
-- 4. Create policies for pos_cash_operations
DROP POLICY IF EXISTS "Users can view their own session operations" ON public.pos_cash_operations;
CREATE POLICY "Users can view their own session operations" ON public.pos_cash_operations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.pos_sessions s
            WHERE s.id = pos_cash_operations.session_id
                AND s.agent_id = (
                    -- FIX: changed from user_id to agent_id
                    select auth.uid()
                )
        )
    );
DROP POLICY IF EXISTS "Users can insert operations in their open sessions" ON public.pos_cash_operations;
CREATE POLICY "Users can insert operations in their open sessions" ON public.pos_cash_operations FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.pos_sessions s
            WHERE s.id = pos_cash_operations.session_id
                AND s.agent_id = (
                    -- FIX: changed from user_id to agent_id
                    select auth.uid()
                )
                AND s.end_time IS NULL -- FIX: changed from closed_at to end_time
        )
    );
DROP POLICY IF EXISTS "Admins can view all operations" ON public.pos_cash_operations;
CREATE POLICY "Admins can view all operations" ON public.pos_cash_operations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = (
                    select auth.uid()
                )
                AND profiles.role IN ('admin', 'super-admin') -- FIX: added super-admin
        )
    );