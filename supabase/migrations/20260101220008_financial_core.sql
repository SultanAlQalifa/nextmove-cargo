-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Financial Engine Core (Escrow Model)
-- ═══════════════════════════════════════════════════════════════
-- 1. ENUMS
-- Create types if they don't exist
DO $$ BEGIN CREATE TYPE financial_category AS ENUM (
    'escrow_deposit',
    'platform_fee',
    'forwarder_payout',
    'refund',
    'deposit',
    'withdrawal',
    'payment'
);
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE release_status AS ENUM ('locked', 'released', 'disputed', 'cancelled');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. TABLE UPDATES
-- Update transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS category financial_category DEFAULT 'payment',
    ADD COLUMN IF NOT EXISTS release_status release_status DEFAULT 'released',
    -- Default released for old txns
ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id);
-- Update shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS financial_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS forwarding_amount NUMERIC(10, 2),
    -- The share for the forwarder
ADD COLUMN IF NOT EXISTS platform_amount NUMERIC(10, 2),
    -- The share for the platform
ADD COLUMN IF NOT EXISTS escrow_status release_status DEFAULT 'locked';
-- Create system_settings table for configurable rules
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- Insert Default Fee Allocation Rules
INSERT INTO system_settings (key, value, description)
VALUES (
        'fee_allocation_rules',
        '{
        "freight": "forwarder",
        "packaging": "platform",
        "insurance": "platform",
        "taxes": "platform",
        "priority": "platform",
        "inspection": "platform",
        "door_to_door": "platform",
        "customs": "forwarder" 
    }'::jsonb,
        'Rules defining who receives the funds for each fee type. "forwarder" or "platform".'
    ) ON CONFLICT (key) DO NOTHING;
-- 3. FUNCTIONS
-- Function A: Calculate Split (Pure Logic)
CREATE OR REPLACE FUNCTION calculate_shipment_split(p_offer_id UUID) RETURNS JSONB AS $$
DECLARE v_offer RECORD;
v_rules JSONB;
v_forwarder_total NUMERIC := 0;
v_platform_total NUMERIC := 0;
v_breakdown JSONB := '{}'::jsonb;
BEGIN -- Get Offer Data
SELECT * INTO v_offer
FROM rfq_offers
WHERE id = p_offer_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Offer not found';
END IF;
-- Get Allocation Rules
SELECT value INTO v_rules
FROM system_settings
WHERE key = 'fee_allocation_rules';
IF v_rules IS NULL THEN -- Fallback default
v_rules := '{"freight": "forwarder", "default": "platform"}'::jsonb;
END IF;
-- 1. Base Price (Freight)
IF (v_rules->>'freight')::text = 'forwarder' THEN v_forwarder_total := v_forwarder_total + v_offer.base_price;
v_breakdown := jsonb_set(
    v_breakdown,
    '{freight}',
    jsonb_build_object(
        'amount',
        v_offer.base_price,
        'recipient',
        'forwarder'
    )
);
ELSE v_platform_total := v_platform_total + v_offer.base_price;
v_breakdown := jsonb_set(
    v_breakdown,
    '{freight}',
    jsonb_build_object(
        'amount',
        v_offer.base_price,
        'recipient',
        'platform'
    )
);
END IF;
-- 2. Packaging
IF v_offer.packaging_price > 0 THEN IF (v_rules->>'packaging')::text = 'forwarder' THEN v_forwarder_total := v_forwarder_total + v_offer.packaging_price;
ELSE v_platform_total := v_platform_total + v_offer.packaging_price;
END IF;
END IF;
-- 3. Insurance
IF v_offer.insurance_price > 0 THEN IF (v_rules->>'insurance')::text = 'forwarder' THEN v_forwarder_total := v_forwarder_total + v_offer.insurance_price;
ELSE v_platform_total := v_platform_total + v_offer.insurance_price;
END IF;
END IF;
-- 4. Taxes
IF v_offer.tax_price > 0 THEN v_platform_total := v_platform_total + v_offer.tax_price;
-- Taxes usually go to platform to remit? Or Forwarder? Assuming Platform.
END IF;
RETURN jsonb_build_object(
    'forwarder_amount',
    v_forwarder_total,
    'platform_amount',
    v_platform_total,
    'currency',
    v_offer.currency,
    'breakdown',
    v_breakdown
);
END;
$$ LANGUAGE plpgsql;
-- Function B: Process Payment (Escrow Logic)
CREATE OR REPLACE FUNCTION process_shipment_payment_escrow(p_shipment_id UUID, p_user_id UUID) RETURNS JSONB AS $$
DECLARE v_shipment RECORD;
v_split JSONB;
v_wallet_id UUID;
v_balance NUMERIC;
v_total_amount NUMERIC;
BEGIN -- 1. Get Shipment & Offer Info
SELECT s.*,
    o.total_price,
    o.currency INTO v_shipment
FROM shipments s
    JOIN rfq_offers o ON s.offer_id = o.id
WHERE s.id = p_shipment_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found';
END IF;
v_total_amount := v_shipment.total_price;
-- 2. Check Client Wallet Balance
SELECT id,
    balance INTO v_wallet_id,
    v_balance
FROM wallets
WHERE user_id = p_user_id;
IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found';
END IF;
IF v_balance < v_total_amount THEN RAISE EXCEPTION 'Insufficient balance';
END IF;
-- 3. Calculate Split (or use existing)
v_split := calculate_shipment_split(v_shipment.offer_id);
-- 4. Execute Payment (Deduct from Client)
UPDATE wallets
SET balance = balance - v_total_amount,
    updated_at = now()
WHERE id = v_wallet_id;
-- 5. Record Client Debit Transaction
INSERT INTO transactions (
        wallet_id,
        user_id,
        amount,
        type,
        status,
        description,
        reference_id,
        category,
        shipment_id
    )
VALUES (
        v_wallet_id,
        p_user_id,
        - v_total_amount,
        'debit',
        'completed',
        'Payment for shipment ' || v_shipment.tracking_number,
        p_shipment_id::text,
        'payment',
        p_shipment_id
    );
-- 6. Record Platform Revenue (Credit Platform "Virtual" Wallet - effectively just a record)
-- We record this as a 'platform_fee' transaction, potentially linked to a system wallet if we had one.
-- For now, just a record.
-- 7. Record Forwarder Escrow (LOCKED)
-- We assume the forwarder has a wallet.
DECLARE v_fwd_wallet_id UUID;
BEGIN
SELECT id INTO v_fwd_wallet_id
FROM wallets
WHERE user_id = v_shipment.forwarder_id;
-- Create wallet if not exists (auto-provision)
IF v_fwd_wallet_id IS NULL THEN
INSERT INTO wallets (user_id, currency, balance)
VALUES (v_shipment.forwarder_id, v_shipment.currency, 0)
RETURNING id INTO v_fwd_wallet_id;
END IF;
INSERT INTO transactions (
        wallet_id,
        user_id,
        amount,
        type,
        status,
        description,
        reference_id,
        category,
        release_status,
        shipment_id
    )
VALUES (
        v_fwd_wallet_id,
        v_shipment.forwarder_id,
        (v_split->>'forwarder_amount')::numeric,
        'credit',
        'pending',
        -- Pending because it's locked
        'Escrow payment for shipment ' || v_shipment.tracking_number,
        p_shipment_id::text,
        'escrow_deposit',
        'locked',
        p_shipment_id
    );
END;
-- 8. Update Shipment
UPDATE shipments
SET status = 'pending',
    -- Moves to pending confirmation
    financial_snapshot = v_split,
    forwarding_amount = (v_split->>'forwarder_amount')::numeric,
    platform_amount = (v_split->>'platform_amount')::numeric,
    escrow_status = 'locked',
    payment_status = 'paid'
WHERE id = p_shipment_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Payment secure. Funds locked in escrow.'
);
END;
$$ LANGUAGE plpgsql;
-- Function C: Release Funds (Triggered by POD)
CREATE OR REPLACE FUNCTION release_shipment_funds(p_shipment_id UUID) RETURNS JSONB AS $$
DECLARE v_txn RECORD;
v_shipment RECORD;
BEGIN -- 1. Verify Shipment Status
SELECT * INTO v_shipment
FROM shipments
WHERE id = p_shipment_id;
-- In strict mode, we might require 'delivered' status. For now, we trust the caller (Admin/System).
-- 2. Find Locked Transaction
SELECT * INTO v_txn
FROM transactions
WHERE shipment_id = p_shipment_id
    AND category = 'escrow_deposit'
    AND release_status = 'locked' FOR
UPDATE;
-- Lock row
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'No locked funds found for this shipment.'
);
END IF;
-- 3. Update Transaction to Released
UPDATE transactions
SET release_status = 'released',
    status = 'completed',
    -- Now it contributes to balance
    updated_at = now()
WHERE id = v_txn.id;
-- 4. Credit Forwarder Wallet
UPDATE wallets
SET balance = balance + v_txn.amount,
    updated_at = now()
WHERE id = v_txn.wallet_id;
-- 5. Update Shipment Escrow Status
UPDATE shipments
SET escrow_status = 'released'
WHERE id = p_shipment_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Funds released to forwarder.'
);
END;
$$ LANGUAGE plpgsql;