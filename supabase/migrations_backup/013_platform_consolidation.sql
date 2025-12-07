-- ═══════════════════════════════════════════════════════════════
-- NextMove Cargo - Platform Consolidation & Security
-- Phase: System Health Check Fixes
-- ═══════════════════════════════════════════════════════════════
-- 1. FIX STAFF ROLES (Ensure Text IDs)
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
        auth.uid() = owner_id
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Users can upload documents" ON documents FOR
INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE TO authenticated USING (
    auth.uid() = owner_id
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
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
CREATE POLICY "Users can view own invoices" ON invoices FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
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
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
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
DROP POLICY IF EXISTS "Public Avatars" ON storage.objects;
CREATE POLICY "Public Avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Branding
DROP POLICY IF EXISTS "Public Branding" ON storage.objects;
CREATE POLICY "Public Branding" ON storage.objects FOR
SELECT USING (bucket_id = 'branding');
DROP POLICY IF EXISTS "Admins can manage branding" ON storage.objects;
CREATE POLICY "Admins can manage branding" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'branding'
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- Documents
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
-- 5. UPGRADE RPC & SECURITY TRIGGER
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$ BEGIN IF current_setting('app.bypass_role_check', true) = 'on' THEN RETURN NEW;
END IF;
IF (
    TG_OP = 'UPDATE'
    AND OLD.role IS DISTINCT
    FROM NEW.role
) THEN IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
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
DROP TRIGGER IF EXISTS check_role_change ON profiles;
CREATE TRIGGER check_role_change BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
CREATE OR REPLACE FUNCTION upgrade_to_forwarder(plan_id TEXT DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_current_role TEXT;
BEGIN v_user_id := auth.uid();
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
SET role = 'forwarder',
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