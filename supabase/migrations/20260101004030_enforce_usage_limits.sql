-- Migration: Enforce Usage Limits (RFQ & Shipments) based on Subscription Plan
-- Date: 2026-01-01
-- Author: Antigravity Audit
-- 1. Helper function to get plan feature limit
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
-- Unlimited
ELSIF v_plan_name IS NOT NULL THEN -- Elite / Enterprise
RETURN 99999;
-- Unlimited
END IF;
-- 4. Default for Forwarders without active plan
RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Trigger Function to check RFQ Limit
CREATE OR REPLACE FUNCTION check_rfq_monthly_limit() RETURNS TRIGGER AS $$
DECLARE v_limit INTEGER;
v_count INTEGER;
BEGIN -- Get Limit
v_limit := get_plan_limit(NEW.client_id, 'rfq_monthly_limit');
-- Count existing RFQs this month
SELECT COUNT(*) INTO v_count
FROM rfq_requests
WHERE client_id = NEW.client_id
    AND created_at >= date_trunc('month', CURRENT_DATE);
IF v_count >= v_limit THEN RAISE EXCEPTION 'Plan Limit Reached: You can only create % RFQs per month. Please upgrade your plan.',
v_limit;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. Trigger Function to check Shipment Limit
CREATE OR REPLACE FUNCTION check_shipment_monthly_limit() RETURNS TRIGGER AS $$
DECLARE v_limit INTEGER;
v_count INTEGER;
BEGIN -- Get Limit
v_limit := get_plan_limit(NEW.client_id, 'shipment_monthly_limit');
-- Count existing Shipments this month
SELECT COUNT(*) INTO v_count
FROM shipments
WHERE client_id = NEW.client_id
    AND created_at >= date_trunc('month', CURRENT_DATE);
IF v_count >= v_limit THEN RAISE EXCEPTION 'Plan Limit Reached: You can only create % Shipments per month. Please upgrade your plan.',
v_limit;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 4. Apply Triggers
DROP TRIGGER IF EXISTS tr_check_rfq_limit ON rfq_requests;
CREATE TRIGGER tr_check_rfq_limit BEFORE
INSERT ON rfq_requests FOR EACH ROW EXECUTE FUNCTION check_rfq_monthly_limit();
DROP TRIGGER IF EXISTS tr_check_shipment_limit ON shipments;
CREATE TRIGGER tr_check_shipment_limit BEFORE
INSERT ON shipments FOR EACH ROW EXECUTE FUNCTION check_shipment_monthly_limit();