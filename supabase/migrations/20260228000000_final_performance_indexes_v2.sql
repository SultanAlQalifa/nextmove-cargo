-- Final Performance Indexes for Mock Data Replacement V2
-- Adjusted target table name to match schema.
CREATE INDEX IF NOT EXISTS idx_saved_quotes_user_id ON public.saved_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shipment_id ON public.transactions(shipment_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_client_id ON public.rfq_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_client_id ON public.shipments(client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_forwarder_id ON public.shipments(forwarder_id);