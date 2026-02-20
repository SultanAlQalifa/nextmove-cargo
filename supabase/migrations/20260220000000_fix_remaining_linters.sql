-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Final Linter Fixes (Search Path)
-- Date: 2026-02-20
-- ═══════════════════════════════════════════════════════════════
-- SECURE SEARCH PATHS FOR IDENTIFIED FUNCTIONS
ALTER FUNCTION public.update_forwarder_rating()
SET search_path = public;
ALTER FUNCTION public.update_loyalty_balance()
SET search_path = public;
ALTER FUNCTION public.create_sales_lead(text, jsonb)
SET search_path = public;