# 🚀 Instructions: Exécuter le Script SQL RFQ

## 📋 Étape 1: Accéder à Supabase

1. Ouvrez votre **Supabase Dashboard**
2. Sélectionnez votre projet NextMove Cargo
3. Allez dans **SQL Editor** (dans le menu de gauche)

## 📝 Étape 2: Exécuter le Script

1. Cliquez sur **"New Query"**
2. Copiez tout le contenu du fichier `supabase/migrations/001_rfq_system.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

## ✅ Étape 3: Vérification

Après l'exécution, vérifiez que les tables ont été créées :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rfq_requests', 'rfq_offers');

-- Vérifier les enums
SELECT typname 
FROM pg_type 
WHERE typname IN ('rfq_status', 'offer_status');
```

Vous devriez voir :

- ✅ Table `rfq_requests`
- ✅ Table `rfq_offers`
- ✅ Enum `rfq_status`
- ✅ Enum `offer_status`

## 🎯 Ce que le script crée

### Tables

- **`rfq_requests`** - Demandes de devis des clients
- **`rfq_offers`** - Offres des transitaires

### Sécurité (RLS)

- Policies pour Clients (voir/créer/modifier leurs RFQs)
- Policies pour Forwarders (voir RFQs publiées, créer offres)
- Policies pour Admins (accès complet)

### Automatisations

- Auto-update du statut RFQ quand première offre reçue
- Auto-calcul de la date d'expiration des offres
- Auto-update du timestamp `updated_at`

## ⚠️ En cas d'erreur

Si vous voyez une erreur du type "type already exists" :

- C'est normal si vous avez déjà des enums `transport_mode` ou `service_type`
- Le script gère ça automatiquement avec `DO $$ BEGIN ... EXCEPTION ...`

## 📞 Besoin d'aide ?

Si vous rencontrez un problème, partagez-moi l'erreur exacte et je vous aiderai !

---

**Une fois le script exécuté avec succès, dites-moi "OK" et je continuerai avec l'interface utilisateur ! 🎨**
