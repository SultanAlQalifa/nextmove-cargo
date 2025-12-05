# Environment Variables Setup

Vous devez créer un fichier `.env` à la racine du projet avec vos identifiants Supabase :

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Comment obtenir vos identifiants Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous ou créez un compte
3. Créez un nouveau projet ou sélectionnez un projet existant
4. Allez dans **Settings** → **API**
5. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Schéma de base de données

Le schéma SQL complet se trouve dans `supabase/schema.sql`. Vous devrez l'exécuter dans votre projet Supabase :

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Créez une nouvelle query
3. Copiez le contenu de `supabase/schema.sql`
4. Exécutez la query

## Redémarrage du serveur

Après avoir créé le fichier `.env` avec vos vraies identifiants :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez-le
npm run dev
```

Le site devrait alors fonctionner correctement !
