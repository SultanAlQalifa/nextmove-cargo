-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- 2. Ensure "Public can view active forwarders" exists and is correct
-- (Re-creating or ensuring it exists to be safe)
DROP POLICY IF EXISTS "Public can view active forwarders" ON public.profiles;
CREATE POLICY "Public can view active forwarders" ON public.profiles FOR
SELECT TO public USING (
        role = 'forwarder'::user_role
        AND account_status = 'active'
    );
-- 3. Allow Authenticated users to view all profiles (Prevents anonymous scraping)
-- This ensures that the app (Client seeing Forwarder, Chat, etc.) keeps working for logged-in users.
-- Stricter policies (Client isolation) can be applied in Phase 2 if needed.
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR
SELECT TO authenticated USING (true);
-- 4. Verify Admins still have full access (covered by "Admins can view all profiles" usually, or the auth one above)
-- Existing policy "Admins can view all profiles" usually checks is_admin(). 
-- Since "Authenticated users can view all profiles" covers admins (who are authenticated), this is safe fallback.
-- 5. "Users can view own profile" usually allows UPDATE/INSERT self. SELECT self is covered by #3.
-- We leave existing UPDATE/INSERT policies untouched.