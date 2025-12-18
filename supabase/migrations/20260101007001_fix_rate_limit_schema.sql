-- Migration to unify rate_limits table and check_rate_limit functions
-- This fixes the error: column "window_start" of relation "rate_limits" does not exist
-- 1. Ensure the table has both sets of columns (aliases for compatibility)
DO $$ BEGIN -- Ensure window_start exists (from security_hardening)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'window_start'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN window_start TIMESTAMPTZ DEFAULT NOW();
END IF;
-- Ensure request_count exists (from security_hardening)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'request_count'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN request_count INTEGER DEFAULT 1;
END IF;
-- Ensure last_refill exists (from iron_dome)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'last_refill'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN last_refill TIMESTAMPTZ DEFAULT NOW();
END IF;
-- Ensure tokens exists (from iron_dome)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rate_limits'
        AND column_name = 'tokens'
) THEN
ALTER TABLE public.rate_limits
ADD COLUMN tokens INTEGER DEFAULT 1;
END IF;
END $$;
-- 2. Redefine the 'Iron Dome' version (text, int, int) to use unified columns
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        request_key text,
        limit_count int,
        sub_window_seconds int DEFAULT 60
    ) RETURNS boolean AS $$
DECLARE v_window_start timestamptz;
v_count int;
BEGIN
INSERT INTO public.rate_limits (
        key,
        window_start,
        request_count,
        last_refill,
        tokens
    )
VALUES (request_key, now(), 1, now(), 1) ON CONFLICT (key) DO
UPDATE
SET window_start = CASE
        WHEN public.rate_limits.window_start < now() - (sub_window_seconds || ' seconds')::interval THEN now()
        ELSE public.rate_limits.window_start
    END,
    request_count = CASE
        WHEN public.rate_limits.window_start < now() - (sub_window_seconds || ' seconds')::interval THEN 1
        ELSE public.rate_limits.request_count + 1
    END,
    -- Sync iron_dome columns for backward compatibility
    last_refill = CASE
        WHEN public.rate_limits.window_start < now() - (sub_window_seconds || ' seconds')::interval THEN now()
        ELSE public.rate_limits.window_start
    END,
    tokens = CASE
        WHEN public.rate_limits.window_start < now() - (sub_window_seconds || ' seconds')::interval THEN 1
        ELSE public.rate_limits.request_count + 1
    END
RETURNING request_count INTO v_count;
IF v_count > limit_count THEN RETURN FALSE;
ELSE RETURN TRUE;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Redefine the 'Security Hardening' version (uuid, text, int, int) to use unified columns
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        p_user_id UUID,
        p_action TEXT,
        p_limit INTEGER,
        p_window_seconds INTEGER
    ) RETURNS BOOLEAN AS $$
DECLARE v_key TEXT;
v_count INTEGER;
BEGIN v_key := p_user_id::text || ':' || p_action;
INSERT INTO public.rate_limits (
        key,
        window_start,
        request_count,
        last_refill,
        tokens
    )
VALUES (v_key, NOW(), 1, NOW(), 1) ON CONFLICT (key) DO
UPDATE
SET window_start = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    request_count = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END,
    -- Sync iron_dome columns
    last_refill = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    tokens = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END
RETURNING request_count INTO v_count;
IF v_count > p_limit THEN RETURN FALSE;
ELSE RETURN TRUE;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;