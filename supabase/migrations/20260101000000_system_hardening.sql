-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - System Hardening & Integrity
-- Phase: Security & Reliability
-- ═══════════════════════════════════════════════════════════════
-- 1. TRANSACTIONS INTEGRITY
-- Enforce positive amounts and valid statuses
ALTER TABLE transactions
ADD CONSTRAINT check_transaction_amount_positive CHECK (amount >= 0),
    DROP CONSTRAINT IF EXISTS transactions_status_check,
    -- Drop if exists to be safe/update
ADD CONSTRAINT check_transaction_status_valid CHECK (
        status IN (
            'pending',
            'completed',
            'failed',
            'refunded',
            'cancelled'
        )
    );
-- 2. SUBSCRIPTIONS INTEGRITY
-- Enforce logical dates and valid statuses
ALTER TABLE user_subscriptions -- Allow status to be loosely standard but prevent nonsense
ADD CONSTRAINT check_subscription_status_valid CHECK (
        status IN (
            'active',
            'cancelled',
            'expired',
            'past_due',
            'trial'
        )
    ),
    ADD CONSTRAINT check_subscription_dates_logical CHECK (
        end_date IS NULL
        OR start_date IS NULL
        OR end_date >= start_date
    );
-- 3. PROFILE ROLE INTEGRITY
-- Prevent "Admin" User having "Client" Role Family (Crucial for Access Control)
CREATE OR REPLACE FUNCTION check_role_integrity() RETURNS TRIGGER AS $$
DECLARE v_family text;
BEGIN -- If no staff role assigned, we only ensure role is 'client' or 'driver' or 'forwarder'
-- Actually, if staff_role_id is NULL, user is usually a client or individual forwarder.
-- Strictness: If staff_role_id IS NOT NULL, enforced match.
IF NEW.staff_role_id IS NOT NULL THEN
SELECT role_family INTO v_family
FROM staff_roles
WHERE id = NEW.staff_role_id;
IF v_family = 'admin'
AND NEW.role NOT IN ('admin', 'super-admin', 'support', 'finance') THEN RAISE EXCEPTION 'Integrity Error: User with Admin Family Role must have an admin-type role (admin, super-admin, support, finance). Attempted: %',
NEW.role;
END IF;
IF v_family = 'forwarder'
AND NEW.role <> 'forwarder' THEN RAISE EXCEPTION 'Integrity Error: User with Forwarder Family Role must have role "forwarder". Attempted: %',
NEW.role;
END IF;
IF v_family = 'client'
AND NEW.role <> 'client' THEN RAISE EXCEPTION 'Integrity Error: User with Client Family Role must have role "client". Attempted: %',
NEW.role;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ensure_role_integrity ON profiles;
CREATE TRIGGER ensure_role_integrity BEFORE
INSERT
    OR
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION check_role_integrity();
-- 4. ENSURE INTEGRITY ON ROLES TABLE
-- Prevent creation of new roles with garbage families
ALTER TABLE staff_roles DROP CONSTRAINT IF EXISTS check_role_family_values,
    ADD CONSTRAINT check_role_family_values CHECK (
        role_family IN ('admin', 'forwarder', 'client')
    );