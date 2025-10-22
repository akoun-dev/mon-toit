#!/bin/bash

# ============================================
# SCRIPT DE BASCULE D'ENVIRONNEMENT
# ============================================
# Permet de basculer facilement entre les environnements
# Usage: ./scripts/switch-env.sh [local|production]

ENVIRONMENT=${1:-local}
ENV_FILE=".env.local"

echo "🔄 Basculement vers l'environnement: $ENVIRONMENT"

case $ENVIRONMENT in
  "local")
    echo "📝 Configuration pour l'environnement LOCAL..."
    cat > $ENV_FILE << EOF
# ============================================
# ENVIRONNEMENT DE DÉVELOPPEMENT LOCAL - SUPABASE
# ============================================
# Fichier créé le 2025-10-21 pour utilisation avec Supabase local

# Configuration Supabase Local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Configuration API locale
VITE_API_URL=http://127.0.0.1:54321
VITE_GRAPHQL_URL=http://127.0.0.1:54321/graphql/v1

# Configuration Stockage Local
VITE_SUPABASE_STORAGE_URL=http://127.0.0.1:54321/storage/v1

# Configuration Mapbox (inchangé)
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg

# Configuration développement
VITE_NODE_ENV=development
VITE_DEBUG=true

# Services locaux
VITE_MAILPIT_URL=http://127.0.0.1:54324
VITE_STUDIO_URL=http://127.0.0.1:54323

# Analytics et tracking (désactivés en développement local)
VITE_VERCEL_ANALYTICS_ID=
VITE_SENTRY_DSN=
EOF
    ;;

  "production")
    echo "📝 Configuration pour l'environnement PRODUCTION..."
    cat > $ENV_FILE << EOF
# ============================================
# ENVIRONNEMENT DE PRODUCTION - SUPABASE DISTANT
# ============================================

# Configuration Supabase Production
VITE_SUPABASE_URL=https://gimsjnuubnpvcprbxuie.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbXNqbnV1Ym5wdmNwcmJ4dWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjAwMDksImV4cCI6MjA3NjYzNjAwOX0.5RksRD3e6pXiPoeOHoRJHvOplYm_e3rP5MTam3PQmKc

# Configuration Mapbox (inchangé)
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg

# Production settings
VITE_NODE_ENV=production
VITE_DEBUG=false

# Analytics et tracking (activés en production)
VITE_VERCEL_ANALYTICS_ID=
VITE_SENTRY_DSN=
EOF
    ;;

  *)
    echo "❌ Erreur: Environnement '$ENVIRONMENT' non reconnu"
    echo "Usage: $0 [local|production]"
    exit 1
    ;;
esac

echo "✅ Configuration mise à jour avec succès!"
echo ""
echo "📋 Résumé de la configuration:"
echo "   Environnement: $ENVIRONMENT"
if [ "$ENVIRONMENT" = "local" ]; then
  echo "   URL Supabase: http://127.0.0.1:54321"
  echo "   Studio: http://127.0.0.1:54323"
  echo "   Mail: http://127.0.0.1:54324"
else
  echo "   URL Supabase: https://gimsjnuubnpvcprbxuie.supabase.co"
fi
echo ""
echo "🚀 Redémarrez le serveur de développement pour appliquer les changements:"
echo "   npm run dev"