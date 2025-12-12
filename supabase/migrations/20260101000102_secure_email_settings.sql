-- Create a secure table for system secrets
CREATE TABLE IF NOT EXISTS public.system_secrets (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;
-- Create policy: ONLY Service Role (and potentially super-admin) can access
-- In Supabase, service_role bypasses RLS, so we just need to ENABLE it to block public/anon.
-- We can add a policy for 'admin' role if they need to manage it via UI, 
-- but for now let's keep it strictly for backend processes (service_role).
-- If we want admins to update it, we need a policy.
CREATE POLICY "Admins can manage secrets" ON public.system_secrets FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super-admin')
    )
);
-- Move the sensitive 'email' data from system_settings to system_secrets
INSERT INTO public.system_secrets (key, value)
SELECT key,
    value
FROM public.system_settings
WHERE key = 'email' ON CONFLICT (key) DO
UPDATE
SET value = EXCLUDED.value;
-- Delete the sensitive 'email' data from the public system_settings table
DELETE FROM public.system_settings
WHERE key = 'email';
-- Verify the move (optional select for the user to run manually if needed)
-- SELECT * FROM public.system_secrets;