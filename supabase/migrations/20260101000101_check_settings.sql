-- CHECK SYSTEM SETTINGS KEYS
-- We need to see if there are sensitive keys like 'email', 'secrets', etc.
SELECT key,
    value
FROM public.system_settings;