-- Create table for Forwarder Addresses (Warehouses, Depots, Offices)
CREATE TABLE IF NOT EXISTS forwarder_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forwarder_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('collection', 'reception', 'office')),
    -- collection = drop-off (origin), reception = pickup (dest)
    name text NOT NULL,
    -- "Entrepôt Guangzhou"
    country text NOT NULL,
    city text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    postal_code text,
    contact_name text,
    contact_phone text,
    instructions text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE forwarder_addresses ENABLE ROW LEVEL SECURITY;
-- Policies
-- 1. Forwarders can CRUD their own addresses
CREATE POLICY "Forwarders can manage their own addresses" ON forwarder_addresses FOR ALL TO authenticated USING (auth.uid() = forwarder_id) WITH CHECK (auth.uid() = forwarder_id);
-- 2. Everyone (authenticated) can view addresses (needed for Clients to see them)
-- Or restricted to clients who have a shipment with this forwarder?
-- For simplicity and better UX (browsing forwarder capabilities), let's make it visible to authenticated users.
CREATE POLICY "Authenticated users can view addresses" ON forwarder_addresses FOR
SELECT TO authenticated USING (true);
-- Index for performance
CREATE INDEX idx_forwarder_addresses_forwarder ON forwarder_addresses(forwarder_id);
CREATE INDEX idx_forwarder_addresses_country ON forwarder_addresses(country);