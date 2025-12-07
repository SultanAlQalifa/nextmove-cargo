-- SCRIPT ULTIME DE RÉPARATION ET SÉCURITÉ (ADMIN EMAILS)
-- 1. FONCTION DE SÉCURITÉ ROBUSTE
-- Permet de vérifier si quelqu'un est admin/super-admin, même si RLS est actif.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE user_role text;
BEGIN IF auth.uid() IS NULL THEN RETURN FALSE;
END IF;
SELECT role INTO user_role
FROM public.profiles
WHERE id = auth.uid();
RETURN user_role IN ('admin', 'super-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. SYNCHRONISATION DES PROFILS (FAILSAFE)
-- S'assure que TOUS les comptes Auth ont un Profil Admin (pour le développement local).
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    'super-admin'
FROM auth.users ON CONFLICT (id) DO
UPDATE
SET role = 'super-admin';
-- Force le rôle admin pour tout le monde existant
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
DROP POLICY IF EXISTS "Admins upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read attachments" ON storage.objects;
-- Admin Upload (Admin & Super-Admin)
CREATE POLICY "Admins_Upload_Attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'email-attachments'
        AND public.is_admin()
    );
-- Admin Delete (Admin & Super-Admin)
CREATE POLICY "Admins_Delete_Attachments" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'email-attachments'
    AND public.is_admin()
);
-- Lecture Publique (pour que les images s'affichent dans les mails)
CREATE POLICY "Public_Read_Attachments" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'email-attachments');