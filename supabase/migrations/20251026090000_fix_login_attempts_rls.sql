-- Migration pour corriger les politiques RLS sur login_attempts
-- Date: 2025-10-26
-- Description: Permettre les insertions anonymes pour les tentatives de connexion

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can insert their own login attempts" ON public.login_attempts;

-- Créer une nouvelle politique plus permissive pour les insertions
CREATE POLICY "Allow anonymous insert for login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Maintenir les autres politiques existantes
-- Service role can manage login attempts (déjà existante)
-- Users can view their own login attempts (déjà existante)
-- Users can view own login attempts (déjà existante)
-- Admins with MFA can view all login attempts (déjà existante)

-- Accorder les permissions nécessaires
GRANT INSERT ON public.login_attempts TO anon, authenticated;