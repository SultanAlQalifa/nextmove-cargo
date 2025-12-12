-- Secure Notification RPC
-- Allows authenticated users (like Admin/Forwarder) to send notifications to others.
CREATE OR REPLACE FUNCTION public.send_notification(
        p_user_id UUID,
        p_title TEXT,
        p_message TEXT,
        p_type TEXT,
        p_link TEXT DEFAULT NULL
    ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER -- Runs with privileges of the function creator (admin)
    AS $$ BEGIN
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link,
        is_read
    )
VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_link,
        false
    );
END;
$$;