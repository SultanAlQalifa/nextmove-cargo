-- 1. Create a simple debug log table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
-- Enable RLS (admin only)
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view debug logs" ON public.debug_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- 2. Update the handle_new_user function to be FAIL-SAFE and LOG ERRORS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN BEGIN
INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
WHEN OTHERS THEN -- Catch ANY error and log it, preventing the transaction from failing
INSERT INTO public.debug_logs (event, details)
VALUES (
        'handle_new_user_error',
        jsonb_build_object(
            'error_message',
            SQLERRM,
            'error_state',
            SQLSTATE,
            'user_id',
            NEW.id,
            'user_email',
            NEW.email,
            'meta_role',
            NEW.raw_user_meta_data->>'role'
        )
    );
-- Re-raise warning so it might appear in logs, but return NEW to allow auth creation
RAISE WARNING 'Profile creation failed for user %: %',
NEW.id,
SQLERRM;
END;
RETURN NEW;
END;
$$;