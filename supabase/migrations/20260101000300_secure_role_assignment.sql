-- ═══════════════════════════════════════════════════════════════
-- SECURE ROLE ASSIGNMENT & ADMIN WHITELIST
-- Mitigation for Critical Vulnerability: Unauthorized Role Escalation
-- ═══════════════════════════════════════════════════════════════
-- 1. Create Admin Whitelist Table
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
    email TEXT PRIMARY KEY,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id)
);
-- RLS for whitelist (only current admins can read/write)
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view whitelist" ON public.admin_whitelist FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can manage whitelist" ON public.admin_whitelist FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- Insert initial admins (to be safe, add superuser/dev email if known, otherwise empty)
-- INSERT INTO public.admin_whitelist (email) VALUES ('admin@nextmovecargo.com') ON CONFLICT DO NOTHING;
-- 2. Secure handle_new_user Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public LANGUAGE plpgsql AS $$
DECLARE v_role TEXT;
v_status TEXT;
BEGIN -- SÉCURITÉ : Ne JAMAIS faire confiance aux métadonnées raw_user_meta_data pour le role 'admin'
-- Toujours forcer 'client' par défaut
v_role := 'client';
v_status := 'active';
-- Exception : Si l'email est dans la liste des admins pré-approuvés
IF NEW.email IN (
    SELECT email
    FROM public.admin_whitelist
) THEN v_role := 'admin';
END IF;
-- Si inscription transitaire détectée via métadonnées (passé par BecomeForwarder/Register)
-- On force le statut 'pending_approval' et rôle 'forwarder'
-- On vérifie explicite 'role' ou 'account_type' dans metadata
IF (NEW.raw_user_meta_data->>'role' = 'forwarder')
OR (
    NEW.raw_user_meta_data->>'account_type' = 'forwarder'
) THEN v_role := 'forwarder';
v_status := 'pending_approval';
END IF;
-- Créer le profil avec rôle sécurisé
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        account_status,
        -- Correct column name from schema
        avatar_url,
        transport_modes
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        v_role,
        -- Toujours contrôlé par le serveur
        v_status,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        -- Robust extraction of transport_modes array
        COALESCE(
            (
                SELECT array_agg(x)
                FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(NEW.raw_user_meta_data->'transport_modes') = 'array' THEN NEW.raw_user_meta_data->'transport_modes'
                            ELSE '[]'::jsonb
                        END
                    ) t(x)
            ),
            '{}'::text []
        )
    );
-- Initialiser le wallet à 0 pour tous les utilisateurs
INSERT INTO public.wallets (user_id, balance, currency)
VALUES (
        NEW.id,
        0,
        'XOF' -- Default currency logic
    ) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Logger l'erreur mais ne pas bloquer l'inscription
-- Essayer d'insérer dans debug_logs si possible, sinon raise warning
RAISE WARNING 'Erreur lors de la création du profil pour %: %',
NEW.email,
SQLERRM;
RETURN NEW;
END;
$$;
-- 3. Re-create the Trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();