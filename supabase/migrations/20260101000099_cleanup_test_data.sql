-- ULTIMATE CLEANUP SCRIPT
-- WARNING: This deletes ALL transaction and payment history.
-- Use this only if you want a completely fresh start for the wallet/finance module.
BEGIN;
-- 1. Delete ALL Transactions
-- This handles deposits, withdrawals, payments, coupon usages, etc.
DELETE FROM public.transactions;
-- 2. Reset ALL Wallets to 0
UPDATE public.wallets
SET balance = 0,
    currency = 'XOF';
-- 3. Delete ALL Payments (if table exists and is used)
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_name = 'payments'
) THEN EXECUTE 'DELETE FROM public.payments';
END IF;
END $$;
-- 4. Delete ALL Shipments (Optional - uncomment if you want to wipe shipments too)
-- DELETE FROM public.shipments; 
-- For now, we only delete those that clearly look like tests, just in case
DELETE FROM public.shipments
WHERE tracking_number ILIKE 'TRK-%'
    OR tracking_number ILIKE 'TEST-%';
-- 5. Delete ALL Notifications
DELETE FROM public.notifications;
COMMIT;