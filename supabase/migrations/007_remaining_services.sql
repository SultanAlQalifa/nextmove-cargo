-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Remaining Services Migration
-- Phase 6: Full Backend Transition
-- ═══════════════════════════════════════════════════════════════
-- ═══ ENUMS ═══
DO $$ BEGIN CREATE TYPE fund_call_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE pod_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE fee_type AS ENUM ('percentage', 'fixed');
CREATE TYPE fee_target AS ENUM ('client', 'forwarder');
CREATE TYPE fee_category AS ENUM (
    'insurance',
    'guarantee',
    'management',
    'storage',
    'penalty',
    'tax',
    'other'
);
CREATE TYPE gateway_provider AS ENUM ('wave', 'payoneer', 'stripe', 'orange_money');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- ═══ 1. FUND CALLS ═══
CREATE TABLE IF NOT EXISTS fund_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    status fund_call_status DEFAULT 'pending',
    requester_id UUID REFERENCES profiles(id) NOT NULL,
    reason TEXT,
    due_date TIMESTAMP,
    attachments TEXT [] DEFAULT '{}',
    -- Array of URLs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fund_calls_requester ON fund_calls(requester_id);
ALTER TABLE fund_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fund calls" ON fund_calls FOR
SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Admins can view all fund calls" ON fund_calls FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ 2. PROOF OF DELIVERY (POD) ═══
CREATE TABLE IF NOT EXISTS pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) NOT NULL,
    -- Assumes shipments table exists
    tracking_number VARCHAR(100),
    status pod_status DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    notes TEXT,
    documents JSONB DEFAULT '[]',
    -- Array of {url, name, type}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pods_shipment ON pods(shipment_id);
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forwarders/Clients can view related PODs" ON pods FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = pods.shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                )
        )
    );
CREATE POLICY "Forwarders can create PODs" ON pods FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_id
                AND s.forwarder_id = auth.uid()
        )
    );
CREATE POLICY "Admins can manage PODs" ON pods FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ 3. FEE CONFIGURATIONS ═══
CREATE TABLE IF NOT EXISTS fee_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type fee_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_amount DECIMAL(15, 2),
    max_amount DECIMAL(15, 2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    category fee_category NOT NULL,
    target fee_target NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    grace_period_hours INTEGER,
    recurring_interval VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE fee_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to fees" ON fee_configs FOR
SELECT USING (true);
CREATE POLICY "Admins can manage fees" ON fee_configs FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ 4. SYSTEM SETTINGS ═══
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    -- e.g., 'regionalization', 'notifications'
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to settings" ON system_settings FOR
SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Seed initial settings
INSERT INTO system_settings (key, value)
VALUES (
        'regionalization',
        '{"default_currency": "XOF", "supported_currencies": ["XOF", "EUR", "USD", "CNY"], "default_language": "fr", "timezone": "Africa/Dakar"}'::jsonb
    ),
    (
        'notifications',
        '{"email_enabled": true, "sms_enabled": false, "push_enabled": true, "admin_email": "admin@nextemove.com"}'::jsonb
    ),
    (
        'security',
        '{"min_password_length": 8, "require_2fa": false, "session_timeout_minutes": 60}'::jsonb
    ),
    (
        'maintenance',
        '{"maintenance_mode": false, "debug_mode": false}'::jsonb
    ) ON CONFLICT (key) DO NOTHING;
-- ═══ 5. PAYMENT GATEWAYS ═══
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider gateway_provider NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_test_mode BOOLEAN DEFAULT FALSE,
    config JSONB,
    -- Stores keys, secrets (should be encrypted in real app, but using JSONB for now)
    supported_currencies TEXT [],
    transaction_fee_percent DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage gateways" ON payment_gateways FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ 6. SUBSCRIPTIONS ═══
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    billing_cycle billing_cycle DEFAULT 'monthly',
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to plans" ON subscription_plans FOR
SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON subscription_plans FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    -- active, cancelled, expired
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- ═══ 7. PERSONNEL / STAFF ROLES ═══
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT [],
    -- Array of permission IDs
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage roles" ON staff_roles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);
-- Add staff_role_id to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES staff_roles(id);
-- Seed initial roles
INSERT INTO staff_roles (name, description, permissions, is_system)
VALUES (
        'Super Admin',
        'Accès complet',
        ARRAY ['all'],
        true
    ),
    (
        'Support',
        'Gestion des tickets',
        ARRAY ['support_view', 'support_manage', 'users_view'],
        true
    ),
    (
        'Finance',
        'Gestion financière',
        ARRAY ['finance_view', 'finance_manage', 'users_view'],
        true
    ) ON CONFLICT (name) DO NOTHING;
-- ═══ 8. SUPPORT TICKETS ═══
CREATE TYPE ticket_category AS ENUM ('technical', 'billing', 'shipment', 'other');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category ticket_category DEFAULT 'other',
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    shipment_ref VARCHAR(100),
    is_escalated BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON tickets FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON tickets FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all tickets" ON tickets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin', 'support')
        )
    );
CREATE POLICY "Staff can update tickets" ON tickets FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin', 'support')
        )
    );
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT [] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM tickets
            WHERE id = ticket_messages.ticket_id
                AND user_id = auth.uid()
        )
    );
CREATE POLICY "Staff can view all messages" ON ticket_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('admin', 'super-admin', 'support')
        )
    );
CREATE POLICY "Users and Staff can send messages" ON ticket_messages FOR
INSERT WITH CHECK (
        (
            EXISTS (
                SELECT 1
                FROM tickets
                WHERE id = ticket_id
                    AND user_id = auth.uid()
            )
        )
        OR (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE id = auth.uid()
                    AND role IN ('admin', 'super-admin', 'support')
            )
        )
    );
-- ═══ TRIGGERS ═══
CREATE TRIGGER update_fund_calls_updated_at BEFORE
UPDATE ON fund_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pods_updated_at BEFORE
UPDATE ON pods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_configs_updated_at BEFORE
UPDATE ON fee_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE
UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE
UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();