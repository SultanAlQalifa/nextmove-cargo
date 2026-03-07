-- Drop existing policies that might cause UPSERT conflicts
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;

-- Admins can insert/update/select everything
CREATE POLICY "Admins can manage system settings" ON system_settings
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = (select auth.uid())) IN ('admin', 'super-admin')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = (select auth.uid())) IN ('admin', 'super-admin')
);
