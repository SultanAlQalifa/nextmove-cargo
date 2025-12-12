-- Trigger to automatically update wallet balance when a DEPOSIT transaction is COMPLETED
-- This handles deposits via Mobile Money or other gateways
CREATE OR REPLACE FUNCTION public.update_wallet_balance() RETURNS TRIGGER AS $$ BEGIN -- Only check for COMPLETED transactions that are DEPOSIT (deposits)
    -- The ENUM value is 'deposit', not 'credit'
    IF NEW.status = 'completed'
    AND NEW.type = 'deposit' THEN -- If it's a new record OR status just changed to completed from something else
    IF (TG_OP = 'INSERT')
    OR (
        TG_OP = 'UPDATE'
        AND OLD.status != 'completed'
    ) THEN -- Calculate new balance (Add amount)
UPDATE public.wallets
SET balance = balance + NEW.amount,
    updated_at = now()
WHERE id = NEW.wallet_id;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Avoid error if trigger already exists
DROP TRIGGER IF EXISTS tr_update_wallet_balance ON public.transactions;
CREATE TRIGGER tr_update_wallet_balance
AFTER
INSERT
    OR
UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();