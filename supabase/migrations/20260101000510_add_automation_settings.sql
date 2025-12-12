-- Add automation_settings column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT '{"auto_quote_enabled": true, "smart_closure_enabled": true, "delivery_feedback_enabled": true, "admin_disabled": []}'::jsonb;
-- Comment on column
COMMENT ON COLUMN public.profiles.automation_settings IS 'Configuration for automated features (auto-quote, smart closure, etc.)';
-- Ensure it's modifiable by the owner (already covered by RLS, but just to be safe in policy context)
-- Existing policies usually allow UPDATE on own profile, so this should work out of the box.