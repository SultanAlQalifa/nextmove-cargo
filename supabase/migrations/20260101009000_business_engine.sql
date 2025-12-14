-- ═══════════════════════════════════════════════════════════════
-- SECTION 13: BUSINESS ENGINE (RFQ → INVOICE → PAYMENT)
-- ═══════════════════════════════════════════════════════════════
-- 1. INVOICE SEQUENCE & NUMBERING
-- ───────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq;
CREATE OR REPLACE FUNCTION public.generate_invoice_number() RETURNS TEXT AS $$
DECLARE year TEXT := to_char(NOW(), 'YYYY');
seq_val INTEGER;
new_number TEXT;
BEGIN seq_val := nextval('public.invoice_seq');
-- Format: INV-2025-0001
new_number := 'INV-' || year || '-' || lpad(seq_val::text, 4, '0');
RETURN new_number;
END;
$$ LANGUAGE plpgsql;
-- 2. ENHANCE INVOICES TABLE
-- ───────────────────────────────────────────────────────────────
-- Ensure table exists (already in 013, but being safe)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    -- "client_id" in logic, but standardizing on user_id for billing
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE
    SET NULL,
        number TEXT NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'XOF',
        status TEXT DEFAULT 'unpaid' CHECK (
            status IN (
                'paid',
                'unpaid',
                'overdue',
                'cancelled',
                'refunded'
            )
        ),
        issue_date TIMESTAMPTZ DEFAULT NOW(),
        due_date TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        pdf_url TEXT,
        -- Link to generated PDF in Storage
        items JSONB DEFAULT '[]',
        -- Snapshot of items/services
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add index
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment ON public.invoices(shipment_id);
-- 3. LINK TRANSACTIONS TO INVOICES
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE
SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_id);
-- 4. AUTO-GENERATE INVOICE ON SHIPMENT CREATION
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_invoice_for_shipment() RETURNS TRIGGER AS $$
DECLARE v_offer_price DECIMAL(15, 2);
v_offer_currency VARCHAR(3);
v_offer_items JSONB;
BEGIN -- Only create invoice if shipment comes from an Accepted Offer (RFQ)
IF NEW.offer_id IS NOT NULL THEN -- Fetch price from offer
SELECT total_price,
    currency,
    jsonb_build_array(
        jsonb_build_object(
            'description',
            'Transport Service (' || NEW.tracking_number || ')',
            'quantity',
            1,
            'price',
            total_price
        )
    ) INTO v_offer_price,
    v_offer_currency,
    v_offer_items
FROM public.rfq_offers
WHERE id = NEW.offer_id;
-- Create Invoice
IF v_offer_price IS NOT NULL THEN
INSERT INTO public.invoices (
        user_id,
        shipment_id,
        amount,
        currency,
        status,
        due_date,
        items
    )
VALUES (
        NEW.client_id,
        -- Matches shipment client
        NEW.id,
        v_offer_price,
        v_offer_currency,
        'unpaid',
        NOW() + INTERVAL '7 days',
        -- Default 7 days payment terms
        v_offer_items
    );
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on Shipments
DROP TRIGGER IF EXISTS tr_create_invoice_on_shipment ON public.shipments;
CREATE TRIGGER tr_create_invoice_on_shipment
AFTER
INSERT ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.create_invoice_for_shipment();
-- 5. AUTO-MARK INVOICE PAID ON PAYMENT
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_invoice_on_payment() RETURNS TRIGGER AS $$ BEGIN -- If transaction is linked to invoice and completed
    IF NEW.invoice_id IS NOT NULL
    AND NEW.status = 'completed' THEN
UPDATE public.invoices
SET status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
WHERE id = NEW.invoice_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on Transactions
DROP TRIGGER IF EXISTS tr_pay_invoice ON public.transactions;
CREATE TRIGGER tr_pay_invoice
AFTER
INSERT
    OR
UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_invoice_on_payment();
-- 6. SECURITY (RLS)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
-- Users view own
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices FOR
SELECT USING (auth.uid() = user_id);
-- Admins manage all
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'super-admin')
    )
);