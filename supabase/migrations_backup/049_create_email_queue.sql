-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        recipient_group TEXT NOT NULL CHECK (
            recipient_group IN ('all', 'clients', 'forwarders', 'specific')
        ),
        recipient_emails JSONB,
        -- Array of specific emails if group is 'specific'
        status TEXT NOT NULL DEFAULT 'pending' CHECK (
            status IN ('pending', 'processing', 'sent', 'failed')
        ),
        error_message TEXT,
        metadata JSONB DEFAULT '{}'::jsonb
);
-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
-- Policies
-- Admins can do everything
CREATE POLICY "Admins can do everything on email_queue" ON public.email_queue FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- View permissions (if needed for audit logs later)
CREATE POLICY "Admins can view email_queue" ON public.email_queue FOR
SELECT USING (public.is_admin());
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at DESC);