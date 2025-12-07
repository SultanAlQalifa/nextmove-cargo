-- 1. Ensure security function exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE current_role text;
BEGIN
SELECT role INTO current_role
FROM profiles
WHERE id = auth.uid();
RETURN current_role IN ('admin', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
-- 3. Apply comprehensive "FOR ALL" policy
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
-- 4. Pre-seed the branding row to ensure "INSERT" permissions don't block "UPDATE" flows
INSERT INTO system_settings (key, value)
VALUES ('branding', '{}'::jsonb) ON CONFLICT (key) DO NOTHING;