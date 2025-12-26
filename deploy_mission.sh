#!/bin/bash

# NextMove Cargo Deployment Script
# --------------------------------

echo " "
echo "🚀 INITIALISATION DE LA SÉQUENCE DE DÉPLOIEMENT"
echo "==============================================="
echo " "

# Ensure /usr/local/bin is in the PATH
export PATH=$PATH:/usr/local/bin

# 1. Vérification Qualité
echo "🔍 Étape 1/3 : Vérification de la qualité du code (Lint)..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ARRÊT D'URGENCE : Le Lint a échoué. Veuillez corriger les erreurs."
    exit 1
fi
echo "✅ Qualité validée."
echo " "

# 2. Build Production
echo "🏗️  Étape 2/3 : Compilation pour la Production (Build)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ARRÊT D'URGENCE : Le Build a échoué."
    exit 1
fi
echo "✅ Build validé."
echo " "

# 3. Envoi Git
echo "📡 Étape 3/3 : Transmission vers le QG (GitHub)..."
echo "Ajout des fichiers..."
git add .

echo "Commit des changements..."
git commit -m "Release: Founder Pack & Security Update"

echo "Push vers 'origin main'..."
git push origin main

if [ $? -eq 0 ]; then
    echo " "
    echo "🌟 SUCCÈS : Code transmis avec succès !"
    echo "Si votre GitHub est connecté à Netlify/Vercel, le déploiement est en cours."
    echo " "
    echo "Bonne chance, Commandant."
else
    echo "⚠️  Attention : Le push Git a échoué. Vérifiez votre connexion ou vos identifiants."
fi
