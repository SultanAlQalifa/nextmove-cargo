-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Early Enum Fix (v2)
-- Ensure all roles are present in user_role enum before processing
-- Created with unique timestamp to avoid collisions
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN -- Add 'super-admin' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'super-admin'
) THEN ALTER TYPE user_role
ADD VALUE 'super-admin';
END IF;
-- Add 'support' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'support'
) THEN ALTER TYPE user_role
ADD VALUE 'support';
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
END IF;
-- Add 'finance' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'finance'
) THEN ALTER TYPE user_role
ADD VALUE 'finance';
END IF;
-- Add 'owner' if not exists
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'owner'
) THEN ALTER TYPE user_role
ADD VALUE 'owner';
END IF;
RAISE NOTICE '✅ Early user_role enum values ensured.';
END $$;