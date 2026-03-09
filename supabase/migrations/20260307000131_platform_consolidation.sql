-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Platform Consolidation & Security
-- Phase: System Health Check Fixes
-- ═══════════════════════════════════════════════════════════════
-- 1. FIX STAFF ROLES (Ensure Text IDs with role_family awareness)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_roles'
        AND column_name = 'role_family'
) THEN
INSERT INTO staff_roles (
        id,
        name,
        description,
        permissions,
        is_system,
        role_family
    )
VALUES (
        'admin',
        'Administrateur',
        'Accès complet',
        ARRAY ['all'],
        true,
        'admin'
    ),
    (
        'manager',
        'Manager',
        'Gestion des opérations',
        ARRAY ['ops_manage', 'users_manage'],
        true,
        'admin'
    ),
    (
        'driver',
        'Chauffeur',
        'Livreur',
        ARRAY ['driver_access'],
        true,
        'forwarder'
    ),
    (
        'support',
        'Support',
        'Gestion des tickets',
        ARRAY ['support_manage'],
        true,
        'admin'
    ) ON CONFLICT (id) DO
UPDATE
SET permissions = EXCLUDED.permissions;
ELSE
INSERT INTO staff_roles (id, name, description, permissions, is_system)
VALUES (
        'admin',
        'Administrateur',
        'Accès complet',
        ARRAY ['all'],
        true
    ),
    (
        'manager',
        'Manager',
        'Gestion des opérations',
        ARRAY ['ops_manage', 'users_manage'],
        true
    ),
    (
        'driver',
        'Chauffeur',
        'Livreur',
        ARRAY ['driver_access'],
        true
    ),
    (
        'support',
        'Support',
        'Gestion des tickets',
        ARRAY ['support_manage'],
        true
    ) ON CONFLICT (id) DO
UPDATE
SET permissions = EXCLUDED.permissions;
END IF;
END $$;
-- 2. DOCUMENTS SYSTEM
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER,
    url TEXT NOT NULL,
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can view own documents" ON documents FOR
SELECT TO authenticated USING (
        (
            select auth.uid()
        ) = owner_id
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = (
                    select auth.uid()
                )
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Users can upload documents" ON documents FOR
INSERT TO authenticated WITH CHECK (
        (
            select auth.uid()
        ) = owner_id
    );
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE TO authenticated USING (
    (
        select auth.uid()
    ) = owner_id
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = (
                select auth.uid()
            )
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- 3. MISSING PAYMENT TABLES (Invoices & Transactions)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    number TEXT NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    status TEXT DEFAULT 'unpaid' CHECK (
        status IN ('paid', 'unpaid', 'overdue', 'cancelled')
    ),
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices FOR
SELECT TO authenticated USING (
        (
            select auth.uid()
        ) = user_id
    );
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = (
                select auth.uid()
            )
            AND role IN ('admin', 'super-admin')
    )
);
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    shipment_id UUID REFERENCES shipments(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('completed', 'pending', 'failed', 'refunded')
    ),
    method TEXT,
    -- 'card', 'mobile_money', 'bank_transfer', 'offline'
    reference TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT TO authenticated USING (
        (
            select auth.uid()
        ) = user_id
    );
DROP POLICY IF EXISTS "Admins can manage transactions" ON transactions;
CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = (
                select auth.uid()
            )
            AND role IN ('admin', 'super-admin')
    )
);
-- 4. STORAGE SECURITY
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
-- Avatars
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Public Avatars'
) THEN CREATE POLICY "Public Avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can upload own avatar'
) THEN CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = (
            select auth.uid()
        )::text
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can update own avatar'
) THEN CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = (
            select auth.uid()
        )::text
    );
END IF;
END $$;
-- Branding
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Public Branding'
) THEN CREATE POLICY "Public Branding" ON storage.objects FOR
SELECT USING (bucket_id = 'branding');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can manage branding'
) THEN CREATE POLICY "Admins can manage branding" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'branding'
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = (
                select auth.uid()
            )
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
END IF;
END $$;
-- Documents
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can upload documents'
) THEN CREATE POLICY "Users can upload documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name)) [1] = (
            select auth.uid()
        )::text
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Users can view own documents'
) THEN CREATE POLICY "Users can view own documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND (storage.foldername(name)) [1] = (
            select auth.uid()
        )::text
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins can view all documents'
) THEN CREATE POLICY "Admins can view all documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = (
                    select auth.uid()
                )
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
END IF;
END $$;
-- 5. UPGRADE RPC & SECURITY TRIGGER
-- Drop trigger first to avoid dependency errors during function drop
DROP TRIGGER IF EXISTS check_role_change ON profiles;
DROP FUNCTION IF EXISTS prevent_role_change();
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$ BEGIN IF (
        select current_setting('app.bypass_role_check', true)
    ) = 'on' THEN RETURN NEW;
END IF;
IF (
    TG_OP = 'UPDATE'
    AND OLD.role IS DISTINCT
    FROM NEW.role
) THEN IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = (
            select auth.uid()
        )
        AND (
            role = 'admin'
            OR role = 'super-admin'
        )
) THEN RAISE EXCEPTION 'Non autorisé à changer votre propre rôle.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER check_role_change BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
DROP FUNCTION IF EXISTS upgrade_to_forwarder(TEXT);
CREATE OR REPLACE FUNCTION upgrade_to_forwarder(plan_id TEXT DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_current_role TEXT;
BEGIN v_user_id := (
    select auth.uid()
);
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT role INTO v_current_role
FROM profiles
WHERE id = v_user_id;
IF v_current_role <> 'client'
AND v_current_role <> 'forwarder' THEN RAISE EXCEPTION 'Only clients can upgrade to forwarder status.';
END IF;
PERFORM set_config('app.bypass_role_check', 'on', true);
UPDATE profiles
SET role = 'forwarder'::user_role,
    subscription_plan = plan_id,
    updated_at = NOW()
WHERE id = v_user_id;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Upgraded to forwarder successfully'
);
END;
$$;