# NextMove Cargo 🌍📦

Plateforme logistique moderne facilitant les importations de la Chine vers l'Afrique (Sénégal, Côte d'Ivoire, Mali). Gestion des expéditions, groupages, paiements sécurisés et suivi en temps réel.

## 🚀 Fonctionnalités Principales

- **Calculateur de Devis** : Estimation instantanée (Maritime/Aérien, Standard/Express) avec sélection de transitaire.
- **Tableau de Bord Client** : Suivi des colis, gestion des RFQ (Appels d'offres), facturation.
- **Espace Transitaire** : Gestion des offres, assignation des chauffeurs, mise à jour des statuts.
- **Administration** : Gestion des utilisateurs (KYC), taux de change, branding, et logs système.
- **Paiements** : Intégration Wave, Orange Money et Portefeuille virtuel.

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite, TypeScript, TailwindCSS
- **Backend (BaaS)** : Supabase (Auth, Database, Storage, Edge Functions, Realtime)
- **Internationalisation** : i18next (Français/Anglais)
- **PDF** : jspdf (Génération de factures et bons de livraison)

## 📦 Installation et Démarrage

1. **Cloner le projet**

   ```bash
   git clone https://github.com/votre-repo/nextmove-cargo.git
   cd nextmove-cargo
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration d'environnement**
   Copiez `.env.example` vers `.env` (si disponible) ou configurez les variables :

   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   ```

4. **Lancer le serveur de développement**

   ```bash
   npm run dev
   ```

## ☁️ Edge Functions (Supabase)

Le projet utilise des Edge Functions pour des opérations sécurisées :

- `create-user` : Création administrative d'utilisateurs avec envoi d'email.
- `process-email-queue` : Traitement asynchrone des emails transactionnels (via Resend/SMTP).

Pour déployer les fonctions :

```bash
supabase functions deploy create-user
supabase functions deploy process-email-queue
supabase functions deploy send-email
supabase functions deploy wave-checkout
```

## 🛡️ Sécurité (Iron Dome)

- **Audit Logs** : Traçabilité immuable de toutes les actions critiques.
- **Rate Limiting** : Protection contre le flooding (API & Paiements).
- **Hardening** : En-têtes de sécurité stricts (CSP, HSTS) et validation RPC.

## ⚡ Performance

- **Build Optimisé** : Découpage intelligent du code (Code Splitting) pour un chargement rapide.
- **PWA** : Support hors-ligne et installation sur mobile.

## 🏗️ Build Production

Pour générer les fichiers de production :

```bash
npm run build
```

Les fichiers seront dans le dossier `dist/`.

## 📜 Licence

Tous droits réservés © NextMove Cargo 2025.
