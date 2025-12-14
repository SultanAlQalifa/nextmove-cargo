-- ═══════════════════════════════════════════════════════════════
-- SECTION 11: SECURITY HARDENING (AUDIT & RATE LIMITS)
-- ═══════════════════════════════════════════════════════════════
-- 1. SECURITY AUDIT LOGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        action TEXT NOT NULL,
        -- e.g. 'UPDATE_ROLE', 'DELETE_SHIPMENT'
        table_name TEXT,
        record_id TEXT,
        old_data JSONB,
        new_data JSONB,
        metadata JSONB DEFAULT '{}' -- IP, User Agent (if captured via edge function/headers)
);
-- Index for fast searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.security_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.security_audit_logs(action);
-- RLS: Only Admins can view logs. System can insert.
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Admins can view audit logs" ON public.security_audit_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. AUTOMATIC AUDIT TRIGGER
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_security_action() RETURNS TRIGGER AS $$
DECLARE v_actor_id UUID;
BEGIN v_actor_id := auth.uid();
-- If no authenticated user (e.g. system event), actor_id remains NULL
INSERT INTO public.security_audit_logs (
        actor_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    )
VALUES (
        v_actor_id,
        TG_OP,
        -- INSERT, UPDATE, DELETE
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        CASE
            WHEN TG_OP = 'DELETE'
            OR TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'INSERT'
            OR TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL
        END
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Apply Audit Trigger to Critical Tables
-- 1. Profiles (Role changes, Status changes)
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER
UPDATE
    OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_security_action();
-- 2. Applications (Forwarder approvals)
-- 2. Applications (Forwarder approvals) - Removed (Table does not exist, likely handled in profiles)
-- DROP TRIGGER IF EXISTS tr_audit_applications ON public.applications;
-- CREATE TRIGGER tr_audit_applications
-- AFTER UPDATE OR DELETE ON public.applications
-- FOR EACH ROW EXECUTE FUNCTION public.log_security_action();
-- 3. RATE LIMITING SYSTEM
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    -- format: 'user_id:action'
    window_start TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 1
);
-- RLS: No public access needed. System function accesses it with SECURITY DEFINER.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Helper to check rate limit
-- Returns TRUE if allowed, FALSE if limited.
-- Usage: IF NOT public.check_rate_limit(auth.uid(), 'create_ticket', 5, 60) THEN RAISE EXCEPTION 'Rate Limit'; END IF;
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        p_user_id UUID,
        p_action TEXT,
        p_limit INTEGER,
        -- Max requests
        p_window_seconds INTEGER -- Time window in seconds
    ) RETURNS BOOLEAN AS $$
DECLARE v_key TEXT;
v_window_start TIMESTAMPTZ;
v_count INTEGER;
BEGIN v_key := p_user_id::text || ':' || p_action;
-- Clean up old entries (optional optimization, or rely on periodic cron)
-- DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
INSERT INTO public.rate_limits (key, window_start, request_count)
VALUES (v_key, NOW(), 1) ON CONFLICT (key) DO
UPDATE
SET window_start = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    request_count = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END
RETURNING request_count INTO v_count;
IF v_count > p_limit THEN RETURN FALSE;
ELSE RETURN TRUE;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. ENFORCE RATE LIMITS (TRIGGERS)
-- ───────────────────────────────────────────────────────────────
-- Prevent Ticket Spam (Max 5 tickets per 10 minutes)
CREATE OR REPLACE FUNCTION public.enforce_ticket_rate_limit() RETURNS TRIGGER AS $$ BEGIN IF NOT public.check_rate_limit(auth.uid(), 'create_ticket', 5, 600) THEN RAISE EXCEPTION 'Rate limit exceeded: You are creating tickets too fast. Please wait.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_rate_limit_tickets ON public.tickets;
CREATE TRIGGER tr_rate_limit_tickets BEFORE
INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.enforce_ticket_rate_limit();
-- Prevent RFQ Spam (Max 10 per hour)
CREATE OR REPLACE FUNCTION public.enforce_rfq_rate_limit() RETURNS TRIGGER AS $$ BEGIN IF NOT public.check_rate_limit(auth.uid(), 'create_rfq', 10, 3600) THEN RAISE EXCEPTION 'Rate limit exceeded: Too many RFQs created recently.';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_rate_limit_rfqs ON public.rfq_requests;
CREATE TRIGGER tr_rate_limit_rfqs BEFORE
INSERT ON public.rfq_requests FOR EACH ROW EXECUTE FUNCTION public.enforce_rfq_rate_limit();