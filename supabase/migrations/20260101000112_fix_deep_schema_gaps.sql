-- CRITICAL FIX: Deep Schema Verification Results
-- This migration fills gaps between the Frontend Code and the Database Schema.
-- 1. Fix 'shipments' table
DO $$ BEGIN -- Add transit_duration if missing (used in AddShipmentModal)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'transit_duration'
) THEN
ALTER TABLE public.shipments
ADD COLUMN transit_duration VARCHAR(50);
END IF;
-- Ensure 'arrival_estimated_date' (Double check from previous fix)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'arrival_estimated_date'
) THEN
ALTER TABLE public.shipments
ADD COLUMN arrival_estimated_date DATE;
END IF;
END $$;
-- 2. Fix 'transactions' table (Critical for Payments)
DO $$ BEGIN -- Add shipment_id (Link transaction to shipment)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'shipment_id'
) THEN
ALTER TABLE public.transactions
ADD COLUMN shipment_id UUID REFERENCES public.shipments(id) ON DELETE
SET NULL;
END IF;
-- Add currency (To store 'XOF', 'EUR' per transaction)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'currency'
) THEN
ALTER TABLE public.transactions
ADD COLUMN currency VARCHAR(10) DEFAULT 'XOF';
END IF;
-- Add discount_amount (Used in Coupon logic)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'discount_amount'
) THEN
ALTER TABLE public.transactions
ADD COLUMN discount_amount NUMERIC(12, 2) DEFAULT 0.00;
END IF;
-- Add user_id (Direct link for easier querying, typically implicit via wallet but explicit in code)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'user_id'
) THEN
ALTER TABLE public.transactions
ADD COLUMN user_id UUID REFERENCES public.profiles(id);
END IF;
END $$;
-- 3. Invoices (Quick check based on paymentService usage)
-- Ensure invoice_number exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'invoice_number'
) THEN
ALTER TABLE public.transactions
ADD COLUMN invoice_number VARCHAR(50);
END IF;
END $$;