-- 1. Update Notification Enum
ALTER TYPE notification_type
ADD VALUE IF NOT EXISTS 'connection_request';
ALTER TYPE notification_type
ADD VALUE IF NOT EXISTS 'connection_accepted';
-- 2. Create user_connections table to replace forwarder_clients
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, recipient_id)
);
-- 3. Add Indexes
CREATE INDEX idx_connections_requester ON public.user_connections(requester_id);
CREATE INDEX idx_connections_recipient ON public.user_connections(recipient_id);
CREATE INDEX idx_connections_status ON public.user_connections(status);
-- 4. Migrate Data from forwarder_clients (Treat as Accepted)
INSERT INTO public.user_connections (requester_id, recipient_id, status)
SELECT forwarder_id,
    client_id,
    'accepted'
FROM public.forwarder_clients ON CONFLICT (requester_id, recipient_id) DO NOTHING;
-- 5. Drop old table (Optional: keep for safety or drop? Plan says drop, but let's rename to backup just in case)
ALTER TABLE public.forwarder_clients
    RENAME TO forwarder_clients_backup;
-- 6. RLS Policies
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
-- Users can view connections where they are requester OR recipient
CREATE POLICY "Users can view their own connections" ON public.user_connections FOR
SELECT USING (
        auth.uid() = requester_id
        OR auth.uid() = recipient_id
    );
-- Users can insert requests (as requester)
CREATE POLICY "Users can send connection requests" ON public.user_connections FOR
INSERT WITH CHECK (auth.uid() = requester_id);
-- Users can update status if they are the recipient (Accept/Reject) OR the requester (Cancel?)
-- STRICT RULE: Recipient can update status. Requester can generally only insert.
-- But for "Auto-Link" functionality, the system might need to insert as "accepted" directly?
-- Or we handle auto-link via Service Role or robust policy.
-- For now: Recipient can update row.
CREATE POLICY "Recipients can update status" ON public.user_connections FOR
UPDATE USING (auth.uid() = recipient_id);
-- 7. Trigger for Notification on New Request
CREATE OR REPLACE FUNCTION notify_connection_request() RETURNS TRIGGER AS $$
DECLARE requester_name TEXT;
BEGIN -- Only notify if status is 'pending'
IF NEW.status = 'pending' THEN -- Get requester name
SELECT full_name INTO requester_name
FROM public.profiles
WHERE id = NEW.requester_id;
-- Insert Notification
INSERT INTO public.notifications (user_id, title, message, type, link)
VALUES (
        NEW.recipient_id,
        'Nouvelle demande de connexion',
        COALESCE(requester_name, 'Un utilisateur') || ' souhaite vous ajouter à ses contacts.',
        'connection_request',
        '/dashboard/forwarder/clients' -- Or client/forwarders depending on role, generic link?
    );
END IF;
-- Notify when Accepted
IF NEW.status = 'accepted'
AND OLD.status = 'pending' THEN -- Get recipient name
SELECT full_name INTO requester_name
FROM public.profiles
WHERE id = NEW.recipient_id;
INSERT INTO public.notifications (user_id, title, message, type, link)
VALUES (
        NEW.requester_id,
        'Demande acceptée ! ✅',
        COALESCE(requester_name, 'L''utilisateur') || ' a accepté votre demande de connexion.',
        'connection_accepted',
        '/dashboard/forwarder/clients'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_connection_created_or_updated
AFTER
INSERT
    OR
UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION notify_connection_request();