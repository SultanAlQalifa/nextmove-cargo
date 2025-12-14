-- Fix for 'record "new" has no field "id"' error
-- This migration updates the log_audit_event function to be more robust
-- by using JSONB to extract 'id' or 'key' depending on what is available.
CREATE OR REPLACE FUNCTION public.log_audit_event() RETURNS TRIGGER AS $$
DECLARE v_old_data jsonb;
v_new_data jsonb;
v_record_id text;
BEGIN -- Initialize data based on operation
IF (TG_OP = 'INSERT') THEN v_old_data := null;
v_new_data := to_jsonb(NEW);
-- Try 'id' first, then 'key' (for system_settings), then fallback
v_record_id := COALESCE(v_new_data->>'id', v_new_data->>'key', 'unknown');
ELSIF (TG_OP = 'UPDATE') THEN v_old_data := to_jsonb(OLD);
v_new_data := to_jsonb(NEW);
v_record_id := COALESCE(v_new_data->>'id', v_new_data->>'key', 'unknown');
ELSIF (TG_OP = 'DELETE') THEN v_old_data := to_jsonb(OLD);
v_new_data := null;
v_record_id := COALESCE(v_old_data->>'id', v_old_data->>'key', 'unknown');
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
        -- Check if auth.uid() is available (it might not be in some contexts)
        -- but for our app usage it normally is.
        auth.uid()
    );
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;