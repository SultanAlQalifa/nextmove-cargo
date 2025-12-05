-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ==========================================
-- LOCATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('country', 'port')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public can view active locations" ON locations FOR
SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can view all locations" ON locations FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert locations" ON locations FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can update locations" ON locations FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can delete locations" ON locations FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- ==========================================
-- PACKAGE TYPES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS package_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Authenticated users can view all package types" ON package_types FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Public can view active package types" ON package_types FOR
SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can insert package types" ON package_types FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can update package types" ON package_types FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can delete package types" ON package_types FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- ==========================================
-- STAFF ROLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS staff_roles (
    id TEXT PRIMARY KEY,
    -- Using text ID for simplicity (e.g., 'driver', 'manager')
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT [],
    -- Array of permission strings
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Authenticated users can view roles" ON staff_roles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert roles" ON staff_roles FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can update roles" ON staff_roles FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Authenticated users can delete roles" ON staff_roles FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- ==========================================
-- SHIPMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES auth.users(id),
    forwarder_id UUID REFERENCES auth.users(id),
    driver_id UUID REFERENCES auth.users(id),
    origin_country TEXT,
    destination_country TEXT,
    origin_port TEXT,
    destination_port TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'picked_up',
            'in_transit',
            'customs',
            'delivered',
            'cancelled'
        )
    ),
    transport_mode TEXT CHECK (transport_mode IN ('sea', 'air', 'road', 'rail')),
    service_type TEXT,
    package_type TEXT,
    weight_kg NUMERIC,
    volume_cbm NUMERIC,
    price NUMERIC,
    currency TEXT DEFAULT 'XOF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
-- Policies for Shipments
-- 1. View: Users can view shipments where they are client, forwarder, or driver
CREATE POLICY "Users can view their own shipments" ON shipments FOR
SELECT USING (
        auth.uid() = client_id
        OR auth.uid() = forwarder_id
        OR auth.uid() = driver_id
    );
-- 2. Insert: Authenticated users can create shipments (Clients, Forwarders, and Drivers for simulation)
CREATE POLICY "Authenticated users can create shipments" ON shipments FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
        OR auth.uid() = forwarder_id
        OR auth.uid() = driver_id
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
-- 3. Update: Forwarders and Drivers can update status
CREATE POLICY "Forwarders and Drivers can update shipments" ON shipments FOR
UPDATE TO authenticated USING (
        auth.uid() = forwarder_id
        OR auth.uid() = driver_id
    );
-- ==========================================
-- SHIPMENT EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS shipment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
-- Policies for Events
CREATE POLICY "Users can view events for their shipments" ON shipment_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_events.shipment_id
                AND (
                    s.client_id = auth.uid()
                    OR s.forwarder_id = auth.uid()
                    OR s.driver_id = auth.uid()
                )
        )
    );
CREATE POLICY "Relevant users can insert events" ON shipment_events FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM shipments s
            WHERE s.id = shipment_id
                AND (
                    s.forwarder_id = auth.uid()
                    OR s.driver_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM profiles
                        WHERE id = auth.uid()
                            AND (
                                role = 'admin'
                                OR role = 'super-admin'
                            )
                    )
                )
        )
    );
-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO locations (name, type, status)
VALUES ('Chine', 'country', 'active'),
    ('Sénégal', 'country', 'active'),
    ('France', 'country', 'active'),
    ('États-Unis', 'country', 'active'),
    ('Dubaï (EAU)', 'country', 'active'),
    ('Turquie', 'country', 'active'),
    ('Shanghai', 'port', 'active'),
    ('Dakar', 'port', 'active'),
    ('Le Havre', 'port', 'active') ON CONFLICT DO NOTHING;
INSERT INTO package_types (label, value, status)
VALUES ('Cartons', 'Cartons', 'active'),
    ('Palettes', 'Palettes', 'active'),
    ('Caisses', 'Caisses', 'active'),
    ('Fûts', 'Fûts', 'active'),
    ('Sacs', 'Sacs', 'active'),
    ('Vrac', 'Vrac', 'active'),
    ('Conteneur', 'Conteneur', 'active') ON CONFLICT DO NOTHING;
INSERT INTO consolidations (
        type,
        origin_port,
        destination_port,
        transport_mode,
        total_capacity_cbm,
        total_capacity_kg,
        current_load_cbm,
        current_load_kg,
        departure_date,
        price_per_cbm,
        price_per_kg,
        currency,
        status,
        title
    )
VALUES (
        'forwarder_offer',
        'Shanghai',
        'Dakar',
        'sea',
        76,
        NULL,
        45,
        NULL,
        NOW() + INTERVAL '14 days',
        85000,
        NULL,
        'XOF',
        'open',
        'Groupage Maritime Chine-Sénégal'
    ),
    (
        'forwarder_offer',
        'Dubai',
        'Abidjan',
        'air',
        NULL,
        1000,
        NULL,
        350,
        NOW() + INTERVAL '5 days',
        NULL,
        4500,
        'XOF',
        'open',
        'Express Air Cargo Dubai'
    ),
    (
        'forwarder_offer',
        'Istanbul',
        'Bamako',
        'sea',
        33,
        NULL,
        12,
        NULL,
        NOW() + INTERVAL '21 days',
        95000,
        NULL,
        'XOF',
        'open',
        'Liaison Turquie-Mali'
    ),
    (
        'client_request',
        'Le Havre',
        'Abidjan',
        'sea',
        15,
        NULL,
        0,
        NULL,
        NOW() + INTERVAL '30 days',
        NULL,
        NULL,
        'EUR',
        'open',
        'Recherche Groupage Meubles'
    ),
    (
        'client_request',
        'Guangzhou',
        'Lomé',
        'air',
        NULL,
        500,
        NULL,
        0,
        NOW() + INTERVAL '10 days',
        NULL,
        NULL,
        'USD',
        'open',
        'Urgent: Pièces Détachées'
    ),
    (
        'client_request',
        'New York',
        'Dakar',
        'sea',
        40,
        NULL,
        0,
        NULL,
        NOW() + INTERVAL '45 days',
        NULL,
        NULL,
        'USD',
        'open',
        'Déménagement International'
    );
INSERT INTO staff_roles (id, name, description, permissions, is_system)
VALUES (
        'admin',
        'Administrateur',
        'Accès complet à toutes les fonctionnalités',
        ARRAY ['all'],
        true
    ),
    (
        'manager',
        'Manager',
        'Gestion des opérations et du personnel',
        ARRAY ['ops_manage', 'users_manage'],
        true
    ),
    (
        'driver',
        'Chauffeur',
        'Livreur assigné aux expéditions',
        ARRAY ['driver_access'],
        true
    ),
    (
        'support',
        'Support',
        'Gestion des tickets et relation client',
        ARRAY ['support_manage'],
        true
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;
-- ==========================================
-- PROFILES TABLE (Ensure it exists and has columns)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client',
    company_name TEXT,
    rating NUMERIC DEFAULT 5.0,
    account_status TEXT DEFAULT 'active',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Add columns for Personnel Management if they don't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'staff_role_id'
) THEN
ALTER TABLE profiles
ADD COLUMN staff_role_id TEXT REFERENCES staff_roles(id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'subscription_plan'
) THEN
ALTER TABLE profiles
ADD COLUMN subscription_plan TEXT,
    ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (
        subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')
    ),
    ADD COLUMN kyc_status TEXT DEFAULT 'pending' CHECK (
        kyc_status IN ('pending', 'verified', 'rejected', 'unsubmitted')
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'forwarder_id'
) THEN
ALTER TABLE profiles
ADD COLUMN forwarder_id UUID REFERENCES auth.users(id);
END IF;
END $$;
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Admin & Forwarder Policies
CREATE POLICY "Admins can view all profiles" ON profiles FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Admins can update all profiles" ON profiles FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND (
                    role = 'admin'
                    OR role = 'super-admin'
                )
        )
    );
CREATE POLICY "Forwarders can view their staff" ON profiles FOR
SELECT TO authenticated USING (forwarder_id = auth.uid());
-- ==========================================
-- FIX MISSING COLUMNS IN PROFILES
-- ==========================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'account_status'
) THEN
ALTER TABLE profiles
ADD COLUMN account_status TEXT DEFAULT 'active';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'company_name'
) THEN
ALTER TABLE profiles
ADD COLUMN company_name TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'rating'
) THEN
ALTER TABLE profiles
ADD COLUMN rating NUMERIC DEFAULT 5.0;
END IF;
END $$;
-- ==========================================
-- SYSTEM SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public can view system settings" ON system_settings FOR
SELECT USING (true);
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND (
                role = 'admin'
                OR role = 'super-admin'
            )
    )
);
-- Seed default settings
INSERT INTO system_settings (key, value, description)
VALUES (
        'branding',
        '{"logo": null, "primaryColor": "#3B82F6", "companyName": "NextMove Cargo"}'::jsonb,
        'Global branding settings'
    ),
    (
        'features',
        '{"rfq": true, "tracking": true, "payments": true}'::jsonb,
        'Feature flags'
    ) ON CONFLICT (key) DO NOTHING;
-- ==========================================
-- FIX MISSING COLUMNS IN SYSTEM_SETTINGS
-- ==========================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'system_settings'
        AND column_name = 'description'
) THEN
ALTER TABLE system_settings
ADD COLUMN description TEXT;
END IF;
END $$;
-- ==========================================
-- MIGRATE EXISTING ROLES TO NEW PERMISSIONS
-- ==========================================
-- Admin: All permissions
UPDATE staff_roles
SET permissions = ARRAY [
    'shipments.view', 'shipments.create', 'shipments.edit', 'shipments.delete', 'shipments.status',
    'personnel.view', 'personnel.create', 'personnel.edit', 'personnel.delete', 'personnel.roles',
    'finance.view', 'finance.create', 'finance.payments', 'finance.reports',
    'support.view', 'support.respond', 'support.manage',
    'settings.view', 'settings.manage'
]
WHERE id = 'admin';
-- Manager: Operations + Staff Management + Basic Finance
UPDATE staff_roles
SET permissions = ARRAY [
    'shipments.view', 'shipments.create', 'shipments.edit', 'shipments.status',
    'personnel.view', 'personnel.create', 'personnel.edit',
    'finance.view', 'finance.reports',
    'support.view', 'support.respond'
]
WHERE id = 'manager';
-- Driver: View shipments and update status
UPDATE staff_roles
SET permissions = ARRAY [
    'shipments.view', 'shipments.status'
]
WHERE id = 'driver';
-- Support: Full Support access + View Shipments/Users
UPDATE staff_roles
SET permissions = ARRAY [
    'support.view', 'support.respond', 'support.manage',
    'shipments.view',
    'personnel.view'
]
WHERE id = 'support';
-- ==========================================
-- CONSOLIDATIONS TABLE (Groupage)
-- ==========================================
CREATE TABLE IF NOT EXISTS consolidations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL CHECK (type IN ('forwarder_offer', 'client_request')),
    -- Route
    origin_port TEXT NOT NULL,
    destination_port TEXT NOT NULL,
    transport_mode TEXT NOT NULL CHECK (transport_mode IN ('sea', 'air')),
    -- Capacity & Load
    total_capacity_cbm NUMERIC,
    total_capacity_kg NUMERIC,
    current_load_cbm NUMERIC DEFAULT 0,
    current_load_kg NUMERIC DEFAULT 0,
    -- Dates
    departure_date TIMESTAMP WITH TIME ZONE,
    arrival_date TIMESTAMP WITH TIME ZONE,
    deadline_date TIMESTAMP WITH TIME ZONE,
    -- Pricing
    price_per_cbm NUMERIC,
    price_per_kg NUMERIC,
    min_cbm NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'XOF',
    -- Metadata
    title TEXT,
    description TEXT,
    services_requested TEXT [],
    status TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN (
            'open',
            'closing_soon',
            'full',
            'in_transit',
            'completed',
            'cancelled'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE consolidations ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public can view open forwarder offers" ON consolidations FOR
SELECT USING (
        type = 'forwarder_offer'
        AND status = 'open'
    );
CREATE POLICY "Authenticated users can view all consolidations" ON consolidations FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert consolidations" ON consolidations FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = initiator_id
        AND (
            (
                type = 'forwarder_offer'
                AND EXISTS (
                    SELECT 1
                    FROM profiles
                    WHERE id = auth.uid()
                        AND (
                            role = 'forwarder'
                            OR role = 'admin'
                            OR role = 'super-admin'
                        )
                )
            )
            OR (
                type = 'client_request'
                AND EXISTS (
                    SELECT 1
                    FROM profiles
                    WHERE id = auth.uid()
                        AND (
                            role = 'client'
                            OR role = 'admin'
                            OR role = 'super-admin'
                        )
                )
            )
        )
    );
CREATE POLICY "Users can update their own consolidations" ON consolidations FOR
UPDATE TO authenticated USING (auth.uid() = initiator_id);
CREATE POLICY "Users can delete their own consolidations" ON consolidations FOR DELETE TO authenticated USING (auth.uid() = initiator_id);