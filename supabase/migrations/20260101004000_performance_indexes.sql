-- Migration: High Traffic Performance Optimization (Robust)
-- Adds critical indexes and checks for column existence to prevent errors
-- 1. Profiles Optimization
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'role'
) THEN CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'email'
) THEN CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
END IF;
END $$;
-- 2. Transactions Optimization
-- Ensure user_id exists for direct user history queries (Denormalization for perf)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'user_id'
) THEN
ALTER TABLE public.transactions
ADD COLUMN user_id UUID REFERENCES public.profiles(id);
END IF;
END $$;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'wallet_id'
) THEN CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'user_id'
) THEN CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'status'
) THEN CREATE INDEX IF NOT EXISTS idx_transactions_status_type ON public.transactions(status);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_transactions_created_recent ON public.transactions(created_at DESC);
END IF;
END $$;
-- 3. Notifications Optimization
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'user_id'
) THEN CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id)
WHERE is_read = false;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
END IF;
END $$;
-- 4. Chat System Optimization (conversations & messages)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'messages'
        AND column_name = 'conversation_id'
) THEN CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'messages'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
END IF;
END $$;
-- 5. Support Ticket System Optimization (tickets & ticket_messages)
DO $$ BEGIN -- Tickets Indexes
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'tickets'
) THEN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets'
        AND column_name = 'user_id'
) THEN CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON public.tickets(user_id);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tickets'
        AND column_name = 'updated_at'
) THEN CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON public.tickets(updated_at DESC);
END IF;
END IF;
-- Ticket Messages Indexes
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'ticket_messages'
) THEN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'ticket_id'
) THEN CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ticket_messages'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);
END IF;
END IF;
END $$;
-- 6. Shipments Optimization
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'tracking_number'
) THEN CREATE INDEX IF NOT EXISTS idx_shipments_tracking_search ON public.shipments(tracking_number);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'client_id'
) THEN CREATE INDEX IF NOT EXISTS idx_shipments_composite_user_status ON public.shipments(client_id, status);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'shipments'
        AND column_name = 'departure_date'
) THEN CREATE INDEX IF NOT EXISTS idx_shipments_departure_date ON public.shipments(departure_date DESC);
END IF;
END $$;
-- 7. Audit Logs
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'created_at'
) THEN CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
        AND column_name = 'action'
) THEN CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
END IF;
END $$;