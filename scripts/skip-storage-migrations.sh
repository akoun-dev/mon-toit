#!/bin/bash

# ============================================
# CONTOURNER LES MIGRATIONS DE STOCKAGE TEMPORAIREMENT
# ============================================
# Usage: ./scripts/skip-storage-migrations.sh [enable|disable]

echo "🔧 Gestion des migrations de stockage..."

# Créer le fichier .storage-migrations-disabled si ce n'existe pas
if [ ! -f .storage-migrations-disabled ]; then
    echo "disabled" > .storage-migrations-disabled
fi

ACTION=${1:-enable}

case $ACTION in
  enable)
    echo "✅ Activation des migrations de stockage"
    # Activer les migrations en les renommant
    for file in supabase/migrations/*storage*; do
      if [[ -f "$file" ]]; then
        mv "$file" "${file}.disabled"
        echo "  ✅ $(basename "$file") activée"
      fi
    done
    ;;
  disable)
    echo "🚫 Désactivation des migrations de stockage"
    # Désactiver les migrations en ajoutant .disabled
    for file in supabase/migrations/*storage*; do
      if [[ -f "${file}.disabled" ]]; then
        mv "$file" "${file}.disabled"
        echo "  🚫 $(basename "$file") désactivée"
      fi
    done
    ;;
  *)
    echo "❌ Action inconnue: $ACTION"
    echo "Usage: $0 [enable|disable]"
    exit 1
    ;;
esac

echo "📋 État actuel :"
for file in supabase/migrations/*storage*; do
  if [[ -f "${file}.disabled" ]]; then
    echo "  ❌ $(basename "$file") (désactivé)"
  else
    echo "  ✅ $(basename "$file") (activé)"
  fi
done

echo ""
echo "💡 Pour appliquer les corrections: ./scripts/apply-critical-migrations.sh"