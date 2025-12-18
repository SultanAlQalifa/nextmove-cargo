-- Revised Migration to fix ticket creation error
-- Removes 'support' role causing enum error, and uses explicit TEXT casting
-- 1. Ensure 'tickets' table exists with correct columns
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category TEXT DEFAULT 'other',
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    shipment_ref VARCHAR(100),
    is_escalated BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES auth.users(id),
    sla_deadline TIMESTAMPTZ,
    user_plan TEXT DEFAULT 'starter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Redefine SLA calculation function
CREATE OR REPLACE FUNCTION public.calculate_ticket_sla() RETURNS TRIGGER AS $$
DECLARE v_user_plan TEXT;
BEGIN -- Fetch user's plan directly from profiles
SELECT subscription_plan::TEXT INTO v_user_plan
FROM public.profiles
WHERE id = NEW.user_id;
-- Default to starter if no plan or no profile found
IF v_user_plan IS NULL THEN v_user_plan := 'starter';
END IF;
-- Snapshot the plan
NEW.user_plan := v_user_plan;
-- Enforce Priority and SLA based on Plan
CASE
    v_user_plan
    WHEN 'enterprise' THEN NEW.priority := 'urgent';
NEW.sla_deadline := NOW() + INTERVAL '6 hours';
WHEN 'pro' THEN NEW.priority := 'high';
NEW.sla_deadline := NOW() + INTERVAL '24 hours';
ELSE -- starter or others
NEW.priority := 'medium';
NEW.sla_deadline := NOW() + INTERVAL '48 hours';
END CASE
;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Re-enable trigger
DROP TRIGGER IF EXISTS tr_set_ticket_sla ON public.tickets;
CREATE TRIGGER tr_set_ticket_sla BEFORE
INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.calculate_ticket_sla();
-- 4. Fix RLS (Using ONLY roles confirmed to exist: admin, super-admin, forwarder, client)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN -- Policy for SELECT
DROP POLICY IF EXISTS "view_tickets_policy" ON public.tickets;
CREATE POLICY "view_tickets_policy" ON public.tickets FOR
SELECT USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND (
                    role::TEXT = 'admin'
                    OR role::TEXT = 'super-admin'
                )
        )
    );
-- Policy for INSERT
DROP POLICY IF EXISTS "create_tickets_policy" ON public.tickets;
CREATE POLICY "create_tickets_policy" ON public.tickets FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Policy for UPDATE
DROP POLICY IF EXISTS "update_tickets_policy" ON public.tickets;
CREATE POLICY "update_tickets_policy" ON public.tickets FOR
UPDATE USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND (
                    role::TEXT = 'admin'
                    OR role::TEXT = 'super-admin'
                )
        )
    );
END $$;