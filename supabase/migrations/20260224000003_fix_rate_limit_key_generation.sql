-- Fix check_rate_limit function inserting NULL key
-- Rebuilds the function to correctly generate the unique key and insert all required columns.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
        p_user_id UUID,
        p_action TEXT,
        p_limit INTEGER,
        p_window_seconds INTEGER
    ) RETURNS BOOLEAN AS $$
DECLARE v_key TEXT;
v_count INTEGER;
BEGIN -- 1. Constuire la clé unique COMBINANT l'action et l'ID de l'utilisateur
v_key := p_action || '_' || p_user_id::text;
-- 2. Insérer ou mettre à jour la ligne avec TOUTES les colonnes (y compris celles ajoutées récemment)
INSERT INTO public.rate_limits (
        key,
        user_id,
        action,
        window_start,
        request_count,
        last_refill,
        tokens,
        created_at
    )
VALUES (
        v_key,
        p_user_id,
        p_action,
        NOW(),
        1,
        NOW(),
        1,
        NOW()
    ) ON CONFLICT (key) DO
UPDATE
SET window_start = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    request_count = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END,
    last_refill = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
        ELSE public.rate_limits.window_start
    END,
    tokens = CASE
        WHEN public.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
        ELSE public.rate_limits.request_count + 1
    END
RETURNING request_count INTO v_count;
-- 3. Valider la limite
IF v_count > p_limit THEN RETURN FALSE;
ELSE RETURN TRUE;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;