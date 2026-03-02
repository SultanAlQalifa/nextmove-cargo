-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - SYSTEM SETTINGS & INTEGRATIONS HARDENING
-- Date: 2026-02-23
-- ═══════════════════════════════════════════════════════════════
-- 1. MIGRATE SENSITIVE INTEGRATIONS TO SYSTEM_SECRETS
-- This moves WhatsApp, Twilio, and SMS keys out of the public settings table.
DO $$ BEGIN -- Move WhatsApp config
IF EXISTS (
    SELECT 1
    FROM public.system_settings
    WHERE key = 'integrations'
) THEN
INSERT INTO public.system_secrets (key, value)
SELECT 'integrations_secrets',
    value
FROM public.system_settings
WHERE key = 'integrations' ON CONFLICT (key) DO
UPDATE
SET value = EXCLUDED.value;
END IF;
END $$;
-- 2. HARDEN SYSTEM_SETTINGS RLS
-- We must NOT allow public read access to 'integrations' or 'security' keys.
-- We only allow specific public keys (branding, marketing, regionalization).
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.system_settings;
CREATE POLICY "Allow public read access to non-sensitive settings" ON public.system_settings FOR
SELECT TO anon,
    authenticated USING (
        key IN (
            'branding',
            'marketing',
            'regionalization',
            'maintenance'
        )
    );
CREATE POLICY "Admin full access to all settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin());
-- 3. CLEANUP SYSTEM_SETTINGS
-- Now that integrations are in secrets, we can remove them from the public table (or at least their keys)
-- For safety, we keep the structure but clear the tokens/keys.
UPDATE public.system_settings
SET value = value - 'integrations' || jsonb_build_object(
        'integrations',
        jsonb_build_object(
            'whatsapp',
            jsonb_build_object(
                'enabled',
                (value->'integrations'->'whatsapp'->>'enabled')::boolean,
                'api_key',
                '***HIDDEN***'
            ),
            'twilio',
            jsonb_build_object(
                'enabled',
                (value->'integrations'->'twilio'->>'enabled')::boolean,
                'auth_token',
                '***HIDDEN***'
            ),
            'intech_sms',
            jsonb_build_object(
                'enabled',
                (value->'integrations'->'intech_sms'->>'enabled')::boolean,
                'app_key',
                '***HIDDEN***'
            )
        )
    )
WHERE key = 'integrations';
-- Also clear OpenAI key if it was in ai_chat
UPDATE public.system_settings
SET value = value - 'ai_chat' || jsonb_build_object('ai_chat', value->'ai_chat' - 'api_key')
WHERE key = 'integrations'
    AND value ? 'ai_chat';