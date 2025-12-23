-- Fix audit_logs schema mismatch
DO $$ BEGIN -- 1. Ensure columns exist for newer audit logic
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'table_name'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN table_name TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'record_id'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN record_id TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'operation'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN operation TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'old_data'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN old_data JSONB;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'new_data'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN new_data JSONB;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'changed_by'
) THEN
ALTER TABLE public.audit_logs
ADD COLUMN changed_by UUID REFERENCES auth.users(id);
END IF;
-- 2. Handle legacy columns (keep them but allow NULL)
ALTER TABLE public.audit_logs
ALTER COLUMN action DROP NOT NULL;
ALTER TABLE public.audit_logs
ALTER COLUMN resource DROP NOT NULL;
END $$;
-- 3. Re-consolidate the log_audit_event function to be robust
CREATE OR REPLACE FUNCTION public.log_audit_event() RETURNS TRIGGER AS $$
DECLARE v_old_data JSONB;
v_new_data JSONB;
v_record_id TEXT;
BEGIN -- Determine User
-- Capture Data
IF (TG_OP = 'UPDATE') THEN v_record_id := COALESCE(NEW.id::text, OLD.id::text);
v_old_data := to_jsonb(OLD);
v_new_data := to_jsonb(NEW);
ELSIF (TG_OP = 'DELETE') THEN v_record_id := OLD.id::text;
v_old_data := to_jsonb(OLD);
v_new_data := NULL;
ELSIF (TG_OP = 'INSERT') THEN v_record_id := NEW.id::text;
v_old_data := NULL;
v_new_data := to_jsonb(NEW);
END IF;
-- Insert Log
INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        changed_by,
        old_data,
        new_data,
        created_at,
        -- Backwards compatibility with old schema if needed
        action,
        resource
    )
VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        auth.uid(),
        v_old_data - 'password' - 'encrypted_password',
        v_new_data - 'password' - 'encrypted_password',
        NOW(),
        TG_OP,
        TG_TABLE_NAME
    );
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;