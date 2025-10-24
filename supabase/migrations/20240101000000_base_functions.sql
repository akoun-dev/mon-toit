-- ============================================================
-- Mon Toit — Migration Base: Fonctions Essentielles
-- Date: 2024-01-01
-- Crée les fonctions de base nécessaires pour toutes les autres migrations
-- ============================================================

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fin de migration