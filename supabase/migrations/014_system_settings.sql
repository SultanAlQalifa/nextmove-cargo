-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - System Settings
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- Policies
-- Admins can do everything
CREATE POLICY "Admins can manage system settings" ON system_settings USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Public read access for non-secret settings (optional, depending on needs)
-- For now, restricting to admins only as per plan.
-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE
UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();