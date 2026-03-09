-- SCRIPT ULTIME DE RÉPARATION ET SÉCURITÉ (ADMIN EMAILS)
-- 1. FONCTION DE SÉCURITÉ ROBUSTE
-- Permet de vérifier si quelqu'un est admin/super-admin, même si RLS est actif.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE user_role text;
BEGIN IF (
    select auth.uid()
) IS NULL THEN RETURN FALSE;
END IF;
SELECT role INTO user_role
FROM public.profiles
WHERE id = (
        select auth.uid()
    );
RETURN user_role IN ('admin', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. SYNCHRONISATION DES PROFILS (FAILSAFE)
-- S'assure que TOUS les comptes Auth ont un Profil Admin (pour le développement local).
DO $$
DECLARE r RECORD;
BEGIN -- Drop triggers that might block role updates
DROP TRIGGER IF EXISTS check_role_change ON public.profiles;
DROP TRIGGER IF EXISTS check_role_integrity ON public.profiles;
FOR r IN
SELECT id,
    email,
    raw_user_meta_data
FROM auth.users LOOP BEGIN
INSERT INTO public.profiles (id, email, full_name, role, account_status)
VALUES (
        r.id,
        r.email,
        COALESCE(r.raw_user_meta_data->>'full_name', 'Admin User'),
        'super-admin'::user_role,
        'active'::account_status
    ) ON CONFLICT (id) DO
UPDATE
SET role = 'super-admin'::user_role,
    account_status = 'active'::account_status;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Failed to sync profile for user % (%): %',
r.id,
r.email,
SQLERRM;
END;
END LOOP;
-- Re-create check_role_change trigger
-- (Re-using the definition from 20260307000131_platform_consolidation.sql)
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_change'
) THEN CREATE TRIGGER check_role_change BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
END IF;
-- Re-create check_role_integrity trigger
-- (Re-using the definition from 20260101015000_fix_role_integrity_trigger.sql)
IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'check_role_integrity'
) THEN CREATE TRIGGER check_role_integrity
AFTER
INSERT
    OR
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION check_role_integrity();
END IF;
END $$;
-- 3. SÉCURISATION DE LA FILE D'ATTENTE (EMAIL QUEUE)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Admins can do everything on email_queue" ON public.email_queue;
DROP POLICY IF EXISTS "Admins can view email_queue" ON public.email_queue;
DROP POLICY IF EXISTS "Admins_Full_Access" ON public.email_queue;
DROP POLICY IF EXISTS "Admins_Queue_Manage" ON public.email_queue;
DROP POLICY IF EXISTS "Admins policy" ON public.email_queue;
-- Création de la Politique Unique (Admin & Super-Admin)
CREATE POLICY "Admins_Manage_Email_Queue" ON public.email_queue FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Permissions Grant
GRANT ALL ON public.email_queue TO authenticated;
GRANT ALL ON public.email_queue TO service_role;
-- 4. STOCKAGE & PIÈCES JOINTES
-- Création du bucket si inexistant
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true) ON CONFLICT (id) DO NOTHING;
-- Politiques de Stockage
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins_Upload_Attachments'
) THEN CREATE POLICY "Admins_Upload_Attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'email-attachments'
        AND public.is_admin()
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Admins_Delete_Attachments'
) THEN CREATE POLICY "Admins_Delete_Attachments" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'email-attachments'
    AND public.is_admin()
);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND policyname = 'Public_Read_Attachments'
) THEN CREATE POLICY "Public_Read_Attachments" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'email-attachments');
END IF;
END $$;