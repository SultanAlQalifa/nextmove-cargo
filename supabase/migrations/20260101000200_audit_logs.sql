-- ═══════════════════════════════════════════════════════════════
-- DEEP SECURITY: AUDIT LOGS SYSTEM (FORENSICS)
-- ═══════════════════════════════════════════════════════════════
-- 1. Create Audit Logs Table (Immutable Store)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id TEXT NOT NULL,
    -- UUIDs stored as text for flexibility
    operation VARCHAR(10) NOT NULL,
    -- INSERT, UPDATE, DELETE
    changed_by UUID REFERENCES profiles(id),
    -- Null if system
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    -- Optional, if available via context
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- RLS: Read-only for admins. NO ONE can delete/update logs.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin')
        )
    );
-- 2. Audit Function (The Watchcat 🐱)
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE v_old_data JSONB;
v_new_data JSONB;
v_changed_by UUID;
BEGIN -- Determine User
v_changed_by := auth.uid();
-- Capture Data
IF (TG_OP = 'UPDATE') THEN v_old_data := to_jsonb(OLD);
v_new_data := to_jsonb(NEW);
ELSIF (TG_OP = 'DELETE') THEN v_old_data := to_jsonb(OLD);
v_new_data := NULL;
ELSIF (TG_OP = 'INSERT') THEN v_old_data := NULL;
v_new_data := to_jsonb(NEW);
END IF;
-- Insert Log
INSERT INTO audit_logs (
        table_name,
        record_id,
        operation,
        changed_by,
        old_data,
        new_data
    )
VALUES (
        TG_TABLE_NAME::VARCHAR,
        COALESCE(NEW.id, OLD.id)::TEXT,
        TG_OP::VARCHAR,
        v_changed_by,
        v_old_data - 'password' - 'encrypted_password',
        -- Redact sensitive fields if any
        v_new_data - 'password' - 'encrypted_password'
    );
RETURN NULL;
-- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Attach Triggers to Critical Tables
-- A. Profiles (Watch for Role Escalation / Status Changes)
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
AFTER
INSERT
    OR
UPDATE OF role,
    staff_role_id,
    account_status,
    loyalty_points,
    tier,
    wallet_balance ON profiles FOR EACH ROW EXECUTE FUNCTION log_audit_event();
-- B. Wallets (Watch the Money 💰)
DROP TRIGGER IF EXISTS audit_wallets_changes ON wallets;
CREATE TRIGGER audit_wallets_changes
AFTER
UPDATE OF balance,
    frozen_balance ON wallets FOR EACH ROW EXECUTE FUNCTION log_audit_event();
-- C. System Settings (Watch Config Changes)
DROP TRIGGER IF EXISTS audit_settings_changes ON system_settings;
CREATE TRIGGER audit_settings_changes
AFTER
UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION log_audit_event();
-- D. Payment Gateways (Watch Key Changes)
DROP TRIGGER IF EXISTS audit_gateways_changes ON payment_gateways;
CREATE TRIGGER audit_gateways_changes
AFTER
UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION log_audit_event();