-- Créer la table pour stocker les métadonnées des images Hero
CREATE TABLE IF NOT EXISTS public.hero_carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_type TEXT NOT NULL DEFAULT 'both' CHECK (device_type IN ('desktop', 'mobile', 'both')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_hero_images_active_order ON public.hero_carousel_images(is_active, display_order);
CREATE INDEX idx_hero_images_device ON public.hero_carousel_images(device_type);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_hero_carousel_images_updated_at
  BEFORE UPDATE ON public.hero_carousel_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.hero_carousel_images ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les images actives
CREATE POLICY "Public read access for active hero images"
  ON public.hero_carousel_images
  FOR SELECT
  USING (is_active = true);

-- Admins peuvent tout faire
CREATE POLICY "Admins can manage hero images"
  ON public.hero_carousel_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Créer le bucket public pour les images Hero
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies pour le bucket
CREATE POLICY "Public read access for hero images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hero-images' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update hero images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'hero-images' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete hero images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hero-images' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Fonction helper pour récupérer les images actives
CREATE OR REPLACE FUNCTION public.get_active_hero_images(p_device_type TEXT DEFAULT 'both')
RETURNS TABLE(
  id UUID,
  title TEXT,
  alt_text TEXT,
  image_url TEXT,
  display_order INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hci.id,
    hci.title,
    hci.alt_text,
    hci.image_url,
    hci.display_order
  FROM public.hero_carousel_images hci
  WHERE hci.is_active = true
    AND (hci.device_type = p_device_type OR hci.device_type = 'both')
  ORDER BY hci.display_order ASC, hci.created_at DESC;
END;
$$;