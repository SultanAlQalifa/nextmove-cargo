-- Add consolidation_id to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS consolidation_id UUID REFERENCES consolidations(id) ON DELETE
SET NULL;
-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipments_consolidation ON shipments(consolidation_id);
-- Update RLS if needed (Clients/Forwarders policies already exist on shipments, so standard access applies)
-- If a client creates a shipment via consolidation booking, they are the client_id, so they can view it.
-- The forwarder (initiator of consolidation) is the forwarder_id, so they can view it.