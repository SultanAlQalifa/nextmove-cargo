-- Sync User Roles with Subscriptions
-- Automatically promote users to 'forwarder' if they have an active subscription
-- 1. Update existing users who have an active subscription but are still 'client'
DO $$ BEGIN PERFORM set_config('app.bypass_role_check', 'on', true);
-- 1. Update existing users who have an active subscription but are still 'client'
UPDATE profiles
SET role = 'forwarder'::user_role,
    subscription_status = 'active',
    kyc_status = 'verified'
WHERE role = 'client'::user_role
    AND id IN (
        SELECT user_id
        FROM user_subscriptions
        WHERE status = 'active'
    );
PERFORM set_config('app.bypass_role_check', 'off', true);
END $$;
-- 2. Create a function to handle new subscriptions
CREATE OR REPLACE FUNCTION sync_role_on_subscription() RETURNS TRIGGER AS $$ BEGIN -- If subscription is active, promote user to forwarder
    IF NEW.status = 'active' THEN -- Bypass role check for this system action
    PERFORM set_config('app.bypass_role_check', 'on', true);
UPDATE profiles
SET role = 'forwarder',
    subscription_status = 'active'
WHERE id = NEW.user_id
    AND role = 'client';
-- Only upgrade clients, don't downgrade admins
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Create trigger on user_subscriptions
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscriptions;
CREATE TRIGGER on_subscription_change
AFTER
INSERT
    OR
UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION sync_role_on_subscription();