-- Rate Limiting System using PostgreSQL
-- Simple Token Bucket or Counter window approach.
-- We will use a Leaky Bucket / Window counter.
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    -- 'ip:endpoint' or 'user:endpoint'
    tokens int DEFAULT 0,
    last_refill timestamptz DEFAULT now()
);
-- Function to check and update rate limit
-- Returns TRUE if request is allowed, FALSE if blocked
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        request_key text,
        limit_count int,
        sub_window_seconds int DEFAULT 60
    ) RETURNS boolean AS $$
DECLARE current_tokens int;
last_update timestamptz;
usage_record record;
BEGIN -- Cleanup old records occasionally (could be a separate cron, but we do lazy check here)
-- Or we just rely on the logic below to reset.
SELECT * INTO usage_record
FROM public.rate_limits
WHERE key = request_key;
IF NOT FOUND THEN
INSERT INTO public.rate_limits (key, tokens, last_refill)
VALUES (request_key, 1, now());
RETURN TRUE;
END IF;
-- If window passed, reset
IF usage_record.last_refill < now() - (sub_window_seconds || ' seconds')::interval THEN
UPDATE public.rate_limits
SET tokens = 1,
    last_refill = now()
WHERE key = request_key;
RETURN TRUE;
END IF;
-- If within window, check limit
IF usage_record.tokens >= limit_count THEN RETURN FALSE;
-- Limit Exceeded
ELSE
UPDATE public.rate_limits
SET tokens = tokens + 1
WHERE key = request_key;
RETURN TRUE;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Index for cleanup (optional, if we add a cleanup cron)
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_refill ON public.rate_limits(last_refill);