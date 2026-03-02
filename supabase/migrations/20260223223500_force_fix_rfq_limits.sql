-- Urgent Fix: Exempt Clients and Admins from RFQ Limits
-- Date: 2026-02-23
-- This script overrides the get_plan_limit function to ensure clients are not blocked.
CREATE OR REPLACE FUNCTION get_plan_limit(p_user_id UUID, p_feature_key TEXT) RETURNS INTEGER AS $$
DECLARE v_role TEXT;
v_plan_name TEXT;
BEGIN -- 1. Identify User Role (Clients & Admins are exempt)
SELECT role INTO v_role
FROM profiles
WHERE id = p_user_id;
IF v_role IN ('client', 'admin', 'super-admin') THEN RETURN 9999;
END IF;
-- 2. For Forwarders, check active subscription
SELECT sp.name INTO v_plan_name
FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = p_user_id
    AND us.status = 'active'
LIMIT 1;
-- 3. Map Plan Name to Limits
IF v_plan_name ILIKE '%Starter%' THEN IF p_feature_key = 'rfq_monthly_limit' THEN RETURN 3;
END IF;
IF p_feature_key = 'shipment_monthly_limit' THEN RETURN 5;
END IF;
ELSIF v_plan_name ILIKE '%Pro%' THEN RETURN 9999;
-- Unlimited for Pro
ELSIF v_plan_name IS NOT NULL THEN -- Elite / Enterprise
RETURN 99999;
-- Unlimited
END IF;
-- 4. Default for Forwarders without active plan
RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;