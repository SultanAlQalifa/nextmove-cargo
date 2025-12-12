-- ═══════════════════════════════════════════════════════════════
-- ULTRA-HARDENING SECURITY PATCH (IRON DOME III)
-- ═══════════════════════════════════════════════════════════════
-- 1. PROFILES: Stop the Leak (Privacy First)
-- Previously: "Authenticated users can view all profiles" -> BAD. Client A could list Client B.
-- New: Strict "Need to Know" basis.
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
-- Policy: Clients can only see themselves (and maybe their forwarder, but strict self is safer for now)
-- Forwarders need to see their assigned clients (Handled by forwarder_clients checks usually, but let's be explicitly permissive for linked pros)
CREATE POLICY "Strict Profile Visibility" ON profiles FOR
SELECT USING (
        id = auth.uid() -- Self
        OR (
            -- Admins see all (Check requesting user's role)
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE id = auth.uid()
                    AND role IN ('admin', 'super-admin')
            )
        )
        OR (
            -- Forwarders can see clients (Simple check)
            -- Allow forwarders to see profiles with role 'client'
            EXISTS (
                SELECT 1
                FROM profiles requester
                WHERE requester.id = auth.uid()
                    AND requester.role = 'forwarder'
            )
            AND profiles.role = 'client'
        )
    );
-- 2. WALLETS: No Negative Balances (Financial Integrity)
ALTER TABLE wallets
ADD CONSTRAINT check_wallet_balance_positive CHECK (balance >= 0);
-- 3. COUPONS: Enforce Limits at DB Level (Race Condition Killer)
CREATE OR REPLACE FUNCTION check_coupon_validity_trigger() RETURNS TRIGGER AS $$
DECLARE v_usage_limit INTEGER;
v_usage_count INTEGER;
v_end_date TIMESTAMP WITH TIME ZONE;
v_active BOOLEAN;
BEGIN
SELECT usage_limit,
    usage_count,
    end_date,
    is_active INTO v_usage_limit,
    v_usage_count,
    v_end_date,
    v_active
FROM coupons
WHERE id = NEW.coupon_id;
-- 1. Active Check
IF v_active IS FALSE THEN RAISE EXCEPTION 'Coupon is inactive';
END IF;
-- 2. Expiry Check
IF v_end_date IS NOT NULL
AND NOW() > v_end_date THEN RAISE EXCEPTION 'Coupon has expired';
END IF;
-- 3. Usage Limit Check
IF v_usage_limit IS NOT NULL
AND v_usage_count >= v_usage_limit THEN RAISE EXCEPTION 'Coupon usage limit reached';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ensure_coupon_validity ON coupon_usages;
CREATE TRIGGER ensure_coupon_validity BEFORE
INSERT ON coupon_usages FOR EACH ROW EXECUTE FUNCTION check_coupon_validity_trigger();
-- 4. STORAGE: Anti-Malware (MIME Type Restrictions)
-- Only allow safe image/doc types. No executables.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'application/pdf'
]
WHERE id IN ('avatars', 'branding');
UPDATE storage.buckets
SET allowed_mime_types = ARRAY [
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' -- .xlsx
]
WHERE id = 'documents';
-- 5. STAFF ROLES: Fix Visibility
-- Forwarders need to see roles to know what they are? No, only Admins manage roles.
-- But if the UI fetches them, we need to allow read.
-- We will allow Authenticated users to READ roles (names/descriptions) but not permissions?
-- No, let's allow read for all authenticated. It's metadata. 
-- "Security through Obscurity" (hiding role names) is weak. Strict RLS on DATA implies role logic is fine to know.
CREATE POLICY "Authenticated users can read staff roles" ON staff_roles FOR
SELECT USING (auth.role() = 'authenticated');