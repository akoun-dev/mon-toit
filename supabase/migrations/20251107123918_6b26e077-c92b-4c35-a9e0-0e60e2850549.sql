-- Phase 8: Renommer les colonnes ANSUT en MZAKA dans la table leases

-- Renommer ansut_certified_at en verified_at
ALTER TABLE public.leases 
RENAME COLUMN ansut_certified_at TO verified_at;

-- Renommer certified_by en verified_by
ALTER TABLE public.leases 
RENAME COLUMN certified_by TO verified_by;

-- Mettre à jour les commentaires pour refléter la nouvelle terminologie
COMMENT ON COLUMN public.leases.verified_at IS 'Date de vérification du bail par MZAKA';
COMMENT ON COLUMN public.leases.verified_by IS 'ID de l''administrateur MZAKA qui a vérifié le bail';