-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id text NOT NULL,
    operation text NOT NULL,
    -- 'INSERT', 'UPDATE', 'DELETE'
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz DEFAULT now(),
    ip_address text -- Optional, if we can capture it via context
);
-- 2. Secure the Table (Immutable)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Policy: Admins can VIEW logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'super-admin')
        )
    );
-- Policy: NO ONE can INSERT/UPDATE/DELETE manually
-- We do NOT create policies for INSERT/UPDATE/DELETE for 'authenticated' or 'public'.
-- This forces all writes to come from Server-Side Triggers (which bypass RLS) or `service_role`.
-- 3. Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.log_audit_event() RETURNS TRIGGER AS $$
DECLARE v_old_data jsonb;
v_new_data jsonb;
v_record_id text;
BEGIN -- Record ID extraction (assumes 'id' column exists)
IF (TG_OP = 'DELETE') THEN v_record_id := OLD.id::text;
v_old_data := to_jsonb(OLD);
v_new_data := null;
ELSIF (TG_OP = 'UPDATE') THEN v_record_id := NEW.id::text;
v_old_data := to_jsonb(OLD);
v_new_data := to_jsonb(NEW);
ELSIF (TG_OP = 'INSERT') THEN v_record_id := NEW.id::text;
v_old_data := null;
v_new_data := to_jsonb(NEW);
END IF;
-- Insert log entry
INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid() -- Captures the user ID from the current session
    );
RETURN NULL;
-- Result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. Attach Triggers to Critical Tables
-- Transactions (Money!)
DROP TRIGGER IF EXISTS audit_transactions ON public.transactions;
CREATE TRIGGER audit_transactions
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
-- Profiles (User Data/Roles)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
-- Platform Rates (Pricing)
DROP TRIGGER IF EXISTS audit_platform_rates ON public.platform_rates;
CREATE TRIGGER audit_platform_rates
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.platform_rates FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
-- Shipments (Cargo Status)
DROP TRIGGER IF EXISTS audit_shipments ON public.shipments;
CREATE TRIGGER audit_shipments
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
-- System Settings (Config) - Re-using the audit logic for settings changes
DROP TRIGGER IF EXISTS audit_system_settings ON public.system_settings;
CREATE TRIGGER audit_system_settings
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();