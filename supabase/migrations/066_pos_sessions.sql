-- Tables de gestion POS
CREATE TABLE IF NOT EXISTS pos_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES forwarder_addresses(id) ON DELETE
    SET NULL,
        forwarder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES pos_stations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    initial_cash DECIMAL(15, 2) DEFAULT 0,
    total_sales DECIMAL(15, 2) DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open'
);
-- Associe les expéditions aux sessions POS
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS pos_session_id UUID REFERENCES pos_sessions(id) ON DELETE
SET NULL;
-- Enable RLS
ALTER TABLE pos_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Forwarders can manage their own stations" ON pos_stations FOR ALL USING (forwarder_id = auth.uid());
CREATE POLICY "Agents can manage their own sessions" ON pos_sessions FOR ALL USING (agent_id = auth.uid());