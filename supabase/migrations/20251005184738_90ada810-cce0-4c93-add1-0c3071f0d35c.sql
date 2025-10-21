-- ============================================
-- PHASE 1: Protection des Numéros de Téléphone
-- ============================================
-- Objectif: Protéger les numéros de téléphone en créant une vue publique
-- et une fonction RPC pour accès contextuel légitime uniquement.

-- ============================================
-- 1. Créer une vue publique sans téléphone
-- ============================================
-- Cette vue expose toutes les informations de profil SAUF le numéro de téléphone
-- Elle sera utilisée pour l'affichage général des profils utilisateurs
-- Vérifier d'abord si la table profiles existe
DO $$
BEGIN
  -- Ne créer la vue que si la table profiles existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- Construire la requête dynamiquement en fonction des colonnes disponibles
    EXECUTE format('
      CREATE OR REPLACE VIEW public.profiles_public AS
      SELECT %s
      FROM public.profiles',
      -- Construire la liste des colonnes dynamiquement en excluant phone
      (SELECT string_agg(column_name, ', ')
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND table_name = 'profiles'
       AND column_name != 'phone' -- Exclure explicitement la colonne phone
      )
    );
  END IF;
END $$;

-- Grant SELECT sur la vue aux utilisateurs authentifiés
GRANT SELECT ON public.profiles_public TO authenticated;

-- Commentaire pour documentation
COMMENT ON VIEW public.profiles_public IS 
'Vue publique des profils utilisateurs sans données sensibles (téléphone exclu). 
Utilisée pour affichage général des profils sur la plateforme.';

-- ============================================
-- 2. Fonction RPC pour accès contextuel au téléphone
-- ============================================
-- Cette fonction retourne le numéro de téléphone UNIQUEMENT dans les cas légitimes :
-- - L'utilisateur demande son propre téléphone
-- - Propriétaire voit le téléphone de ses candidats
-- - Candidat voit le téléphone du propriétaire qu'il a contacté
-- - Parties d'un bail actif
-- - Admins

CREATE OR REPLACE FUNCTION public.get_user_phone(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone text;
  has_access boolean := false;
BEGIN
  -- Cas 1 : L'utilisateur demande son propre téléphone
  IF auth.uid() = target_user_id THEN
    has_access := true;
  END IF;

  -- Cas 2 : Propriétaire voit le téléphone de ses candidats
  -- (candidats qui ont postulé à une propriété du propriétaire)
  IF NOT has_access AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rental_applications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) AND EXISTS (
    SELECT 1 FROM public.rental_applications ra
    JOIN public.properties p ON p.id = ra.property_id
    WHERE ra.applicant_id = target_user_id
      AND p.owner_id = auth.uid()
  ) THEN
    has_access := true;
  END IF;

  -- Cas 3 : Candidat voit le téléphone du propriétaire de la propriété qu'il a candidaté
  IF NOT has_access AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rental_applications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) AND EXISTS (
    SELECT 1 FROM public.rental_applications ra
    JOIN public.properties p ON p.id = ra.property_id
    WHERE ra.applicant_id = auth.uid()
      AND p.owner_id = target_user_id
  ) THEN
    has_access := true;
  END IF;

  -- Cas 4 : Parties d'un bail actif (propriétaire ↔ locataire)
  IF NOT has_access AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leases'
  ) AND EXISTS (
    SELECT 1 FROM public.leases
    WHERE (landlord_id = auth.uid() AND tenant_id = target_user_id)
       OR (tenant_id = auth.uid() AND landlord_id = target_user_id)
  ) THEN
    has_access := true;
  END IF;

  -- Cas 5 : Admins ont accès à tous les téléphones
  IF NOT has_access AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    has_access := true;
  END IF;

  -- Récupérer le téléphone si accès autorisé et si la colonne existe
  IF has_access AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'phone'
  ) THEN
    SELECT phone INTO user_phone
    FROM public.profiles
    WHERE id = target_user_id;

    RETURN user_phone;
  ELSE
    -- Pas d'accès légitime ou colonne phone n'existe pas, retourne NULL
    RETURN NULL;
  END IF;
END;
$$;

-- Grant EXECUTE sur la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_user_phone(uuid) TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.get_user_phone(uuid) IS 
'Retourne le numéro de téléphone d''un utilisateur UNIQUEMENT si l''appelant a un accès légitime.
Cas légitimes :
  1. Utilisateur demande son propre téléphone
  2. Propriétaire voit téléphones de ses candidats
  3. Candidat voit téléphone du propriétaire contacté
  4. Parties d''un bail actif
  5. Administrateurs
Retourne NULL si aucun accès légitime.';

-- ============================================
-- 3. Index pour optimisation des performances
-- ============================================
-- Ces index améliorent les performances des vérifications d'accès
DO $$
BEGIN
  -- Index pour rental_applications si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rental_applications'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_rental_applications_applicant
                  ON public.rental_applications(applicant_id)';

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_rental_applications_property
                  ON public.rental_applications(property_id)';
  END IF;

  -- Index pour leases si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leases'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leases_landlord_tenant
                  ON public.leases(landlord_id, tenant_id)';

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leases_tenant_landlord
                  ON public.leases(tenant_id, landlord_id)';
  END IF;
END $$;