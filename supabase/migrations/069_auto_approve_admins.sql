-- Migration: 069_auto_approve_admins
-- Description: Allow managers and admins to auto-approve their own POS cash operations
DROP POLICY IF EXISTS "Users can insert operations in their open sessions" ON public.pos_cash_operations;
CREATE POLICY "Users can insert operations in their open sessions" ON public.pos_cash_operations FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.pos_sessions s
            WHERE s.id = pos_cash_operations.session_id
                AND s.agent_id = (select auth.uid())
                AND s.status = 'open'
        )
        AND (
            (
                type = 'in'
                AND status = 'approved'
            )
            OR (
                type = 'out'
                AND status = 'pending'
            )
            OR (
                type = 'out'
                AND status = 'approved'
                AND EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = (select auth.uid())
                        AND (
                            p.role = 'admin'
                            OR p.role = 'manager'
                        )
                )
            )
        )
    );
NOTIFY pgrst,
'reload schema';