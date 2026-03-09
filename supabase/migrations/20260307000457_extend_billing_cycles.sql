-- ==========================================
-- SEED PRODUCTION DATA & FEATURES (PART 1: ENUM)
-- ==========================================
-- 1. EXTEND BILLING CYCLES
-- NOTE: If this runs in the same transaction as the usage (047), it might fail with "unsafe use of new value".
-- In that case, run these commands MANUALLY in Supabase SQL Editor first.
ALTER TYPE billing_cycle
ADD VALUE IF NOT EXISTS 'quarterly';
ALTER TYPE billing_cycle
ADD VALUE IF NOT EXISTS 'semiannual';