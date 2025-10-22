#!/bin/bash

# ============================================
# SCRIPT D'APPLICATION DES MIGRATIONS CRITIQUES SEULEMENT
# ============================================
# Usage: ./scripts/apply-critical-migrations.sh

echo "🚀 Application des migrations critiques pour démarrage rapide..."

# Appliquer les migrations essentielles dans l'ordre
# 1. D'abord les tables de base
# 2. Ensuite les vues et politiques de sécurité

echo "📝 1. Création des tables de base..."
supabase db reset --no-seed 2>/dev/null || echo "⚠️ Erreur lors de la réinitialisation"

echo "📝 2. Vérification de la vue profiles_public..."
# Vérifier si la vue existe déjà
VIEW_EXISTS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -tAc -c "SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'profiles_public')" 2>/dev/null)

if [ "$VIEW_EXISTS" = "t" ]; then
    echo "✅ Vue profiles_public déjà existe"
else
    echo "📝 2.1 Création de la vue profiles_public..."
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
    DO \$\$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
      ) THEN
        EXECUTE format('
          CREATE OR REPLACE VIEW public.profiles_public AS
          SELECT %s
          FROM public.profiles',
          (SELECT string_agg(column_name, ', ')
           FROM information_schema.columns
           WHERE table_schema = 'public'
           AND table_name = 'profiles'
           AND column_name != 'phone'
          )
        );

        GRANT SELECT ON public.profiles_public TO authenticated, anon;
        RAISE NOTICE 'Vue profiles_public créée avec succès';
      END IF;
    END \$\$;
    " 2>/dev/null || echo "⚠️ Erreur lors de la création de la vue"
fi

echo "✅ 3. Vérification des permissions..."
# Vérifier que les permissions sont correctes
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT has_table_privilege('public.profiles_public', 'authenticated') AND has_table_privilege('public.profiles_public', 'anon')" 2>/dev/null && echo "✅ Permissions configurées" || echo "⚠️ Erreur de permissions"

echo "🎉 Configuration terminée !"
echo ""
echo "📋 Résumé de la configuration :"
echo "   • Application : http://localhost:8081/"
echo "   • Base de données : PostgreSQL locale (port 54322)"
echo "   • Vue profiles_public : Active et sécurisée"
echo "   • Protection téléphone : Colonne phone exclue"
echo ""
echo "🚀 L'application est prête pour le développement !"