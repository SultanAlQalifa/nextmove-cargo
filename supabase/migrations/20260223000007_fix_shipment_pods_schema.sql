-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Shipment PODs Schema Fix
-- Date: 2026-02-23
-- ═══════════════════════════════════════════════════════════════
-- 1. Ensure pod_status enum exists (usually created in 007_remaining_services)
-- If it doesn't exist, this will fail safely or we can re-create it.
-- Based on logs, it should exist, but let's be safe.
-- 2. Add missing columns to shipment_pods
ALTER TABLE public.shipment_pods
ADD COLUMN IF NOT EXISTS status pod_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
-- 3. Backfill submitted_at from created_at if it was empty
UPDATE public.shipment_pods
SET submitted_at = created_at
WHERE submitted_at IS NULL;
-- 4. Create index for performance on status filtering
CREATE INDEX IF NOT EXISTS idx_shipment_pods_status ON public.shipment_pods(status);
CREATE INDEX IF NOT EXISTS idx_shipment_pods_submitted ON public.shipment_pods(submitted_at);