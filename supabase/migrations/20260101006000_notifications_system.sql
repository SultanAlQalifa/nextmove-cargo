-- ═══════════════════════════════════════════════════════════════
-- SECTION 9: NOTIFICATIONS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- 1. Notifications Table
-- 1. Notifications Table
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'both');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure columns exist (Idempotency for existing tables)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS type public.notification_type DEFAULT 'info';
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
-- Enforce NOT NULL constraints where appropriate (safe update)
-- We do this in DO blocks to avoid errors if data violates it, or just trust the application for now.
-- But for a clean schema, we should enforcing them if the column was just added.
-- Index for fast retrieval of unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications (read status)" ON public.notifications FOR
UPDATE USING (auth.uid() = user_id);
-- System (service role) can insert/manage all.
-- 2. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    -- e.g. 'ticket_update', 'shipment_status', 'billing'
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_type)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.notification_preferences FOR
UPDATE USING (auth.uid() = user_id);
-- 3. Trigger to Auto-Create Preferences on User Creation (Optional, handled by app logic or demand)
-- For now, we assume defaults are TRUE if no row exists.
-- 4. Helper Function to Send Notification (Used by other Triggers)
CREATE OR REPLACE FUNCTION public.create_notification(
        p_user_id UUID,
        p_title TEXT,
        p_message TEXT,
        p_type TEXT DEFAULT 'info',
        p_link TEXT DEFAULT NULL,
        p_data JSONB DEFAULT '{}'
    ) RETURNS UUID AS $$
DECLARE v_notification_id UUID;
BEGIN
INSERT INTO public.notifications (user_id, title, message, type, link, data)
VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type::public.notification_type,
        p_link,
        p_data
    )
RETURNING id INTO v_notification_id;
RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Trigger: Notify on Ticket Update (Response from Support)
-- Triggers when a new message is added to ticket_messages by someone OTHER than the user
CREATE OR REPLACE FUNCTION public.notify_on_ticket_reply() RETURNS TRIGGER AS $$
DECLARE v_ticket_owner UUID;
v_ticket_subject TEXT;
BEGIN -- Get ticket details
SELECT user_id,
    subject INTO v_ticket_owner,
    v_ticket_subject
FROM public.tickets
WHERE id = NEW.ticket_id;
-- If the sender is NOT the ticket owner, it's a support reply
IF NEW.sender_id != v_ticket_owner THEN PERFORM public.create_notification(
    v_ticket_owner,
    'Réponse du Support',
    'Vous avez reçu une réponse pour le ticket : ' || v_ticket_subject,
    'info',
    '/support',
    jsonb_build_object('ticket_id', NEW.ticket_id)
);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS tr_notify_ticket_reply ON public.ticket_messages;
CREATE TRIGGER tr_notify_ticket_reply
AFTER
INSERT ON public.ticket_messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_reply();
-- 6. Trigger: Notify on Payment Success
CREATE OR REPLACE FUNCTION public.notify_on_payment_success() RETURNS TRIGGER AS $$ BEGIN IF NEW.status = 'completed'
    AND OLD.status != 'completed' THEN PERFORM public.create_notification(
        NEW.user_id,
        'Paiement Confirmé',
        'Votre paiement de ' || NEW.amount || ' ' || NEW.currency || ' a été validé avec succès.',
        'success',
        '/dashboard/finance',
        jsonb_build_object('transaction_id', NEW.id)
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS tr_notify_payment_success ON public.transactions;
CREATE TRIGGER tr_notify_payment_success
AFTER
UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment_success();