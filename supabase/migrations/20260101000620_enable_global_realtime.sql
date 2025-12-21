-- Enable Realtime for core tables to ensure cross-page synchronization
BEGIN;
-- Add tables to the 'supabase_realtime' publication
-- If the publication doesn't exist (unlikely in Supabase), it will be created implicitly or fail.
-- We use a robust block to check and add each table.
DO $$
DECLARE target_tables text [] := ARRAY ['rfq_requests', 'rfq_offers', 'quote_requests', 'quotes', 'consolidations', 'shipments', 'transactions', 'profiles', 'wallets', 'referrals'];
t text;
BEGIN FOR t IN
SELECT unnest(target_tables) LOOP IF EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
            AND tablename = t
    ) THEN IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
            AND tablename = t
            AND schemaname = 'public'
    ) THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || t;
END IF;
END IF;
END LOOP;
END $$;
COMMIT;