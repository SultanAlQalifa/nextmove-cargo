-- Migration: 059_pos_cash_approvals
-- Description: Add approval workflow for POS cash withdrawals (Phase 5)
-- 1. Add approval columns to pos_cash_operations
ALTER TABLE public.pos_cash_operations
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS approved_at timestamptz;
-- 2. Update existing records for consistency
-- For existing data, we assume past withdrawals were approved to not break past Z-Reports.
UPDATE public.pos_cash_operations
SET status = 'approved'
WHERE status IS NULL;
-- 3. Modify existing insert policy to force 'pending' for 'out'
-- We drop the old policy and recreate it with the status check
DROP POLICY IF EXISTS "Users can insert operations in their open sessions" ON public.pos_cash_operations;
CREATE POLICY "Users can insert operations in their open sessions" ON public.pos_cash_operations FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.pos_sessions s
            WHERE s.id = pos_cash_operations.session_id
                AND s.agent_id = (
                    select auth.uid()
                ) -- FIX: changed from user_id to agent_id
                AND s.end_time IS NULL -- FIX: changed from closed_at to end_time
        )
        AND (
            -- Cash in is auto-approved, Cash out must be pending
            (
                type = 'in'
                AND (
                    status = 'approved'
                    OR status IS NULL
                )
            )
            OR (
                type = 'out'
                AND (
                    status = 'pending'
                    OR status IS NULL
                )
            )
        )
    );
-- 4. Create policy for Managers / Admins to update operations
DROP POLICY IF EXISTS "Admins and Managers can update operation status" ON public.pos_cash_operations;
CREATE POLICY "Admins and Managers can update operation status" ON public.pos_cash_operations FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = (
                    select auth.uid()
                )
                AND (
                    profiles.role IN ('admin', 'super-admin', 'manager') -- FIX: role check consistency
                )
        )
    ) WITH CHECK (
        status IN ('approved', 'rejected')
        AND approved_by = (
            select auth.uid()
        )
    );