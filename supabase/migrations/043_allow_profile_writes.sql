-- ═══════════════════════════════════════════════════════════════
-- Fix Profile Writes (REVISED)
-- Strict Isolation broke INSERT/UPDATE. Restoring them safely.
-- ═══════════════════════════════════════════════════════════════
-- 1. DROP all potential conflicting policies first
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
-- 2. Allow INSERT (Crucial for Registration)
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- 3. Allow UPDATE (Crucial for Profile Management)
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- 4. Admins Policies
CREATE POLICY "Admins can update all profiles" ON profiles FOR
UPDATE USING (is_admin());
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (is_admin());