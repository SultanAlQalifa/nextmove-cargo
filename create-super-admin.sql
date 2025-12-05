-- Script complet pour créer un compte super-admin
-- À exécuter dans Supabase SQL Editor
-- Étape 1 : Vérifier et ajuster la politique RLS
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Étape 2 : Créer l'utilisateur via l'API Supabase
-- IMPORTANT: Vous devez faire cette étape via l'interface Register de l'application
-- OU via la console Supabase > Authentication > Users > Add User
-- Étape 3 : Une fois le compte créé, mettre à jour le rôle
-- Exécutez cette requête APRÈS avoir créé le compte via Register
UPDATE public.profiles
SET role = 'super-admin'
WHERE email = 'wandifaproperties@gmail.com';
-- Vérification
SELECT id,
    email,
    role,
    created_at
FROM public.profiles
WHERE email = 'wandifaproperties@gmail.com';