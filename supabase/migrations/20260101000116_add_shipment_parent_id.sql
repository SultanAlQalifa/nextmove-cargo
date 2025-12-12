-- Add parent_shipment_id to support Groupage (Sub-shipments)
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS parent_shipment_id UUID REFERENCES public.shipments(id) ON DELETE
SET NULL;
-- Index for faster lookups of children
CREATE INDEX IF NOT EXISTS idx_shipments_parent ON public.shipments(parent_shipment_id);