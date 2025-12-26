-- Migration to add missing roles to user_role enum
-- Roles to add: 'support', 'manager', 'driver'
DO $$ BEGIN -- Add 'support' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'support'
) THEN ALTER TYPE user_role
ADD VALUE 'support';
RAISE NOTICE 'Added "support" to user_role enum';
END IF;
-- Add 'manager' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'manager'
) THEN ALTER TYPE user_role
ADD VALUE 'manager';
RAISE NOTICE 'Added "manager" to user_role enum';
END IF;
-- Add 'driver' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'driver'
) THEN ALTER TYPE user_role
ADD VALUE 'driver';
RAISE NOTICE 'Added "driver" to user_role enum';
END IF;
END $$;