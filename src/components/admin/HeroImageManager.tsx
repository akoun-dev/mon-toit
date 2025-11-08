import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { HeroImageUploadDialog } from "./HeroImageUploadDialog";

interface HeroImage {
  id: string;
  title: string;
  alt_text: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  device_type: string;
  created_at: string;
}

export function HeroImageManager() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_carousel_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des images");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_carousel_images')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(currentStatus ? "Image désactivée" : "Image activée");
      fetchImages();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) return;

    try {
      // Extraire le nom du fichier de l'URL
      const fileName = imageUrl.split('/').pop();
      
      // Supprimer du storage
      if (fileName) {
        await supabase.storage.from('hero-images').remove([fileName]);
      }

      // Supprimer de la table
      const { error } = await supabase
        .from('hero_carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Image supprimée");
      fetchImages();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const getDeviceBadge = (deviceType: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      desktop: { label: "Desktop", variant: "default" },
      mobile: { label: "Mobile", variant: "secondary" },
      both: { label: "Les deux", variant: "outline" },
    };
    const config = variants[deviceType] || variants.both;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🖼️ Gestion des Images Hero</CardTitle>
            <CardDescription>
              Gérer les images du carrousel sur la page d'accueil
            </CardDescription>
          </div>
          <HeroImageUploadDialog onSuccess={fetchImages} />
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Aucune image uploadée</p>
            <p className="text-sm text-muted-foreground">
              Les images Unsplash par défaut seront affichées jusqu'à ce que vous uploadiez vos propres images
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {/* Drag Handle */}
                <div className="cursor-move text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Preview */}
                <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{image.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{image.alt_text}</p>
                  <div className="flex gap-2 mt-1">
                    {getDeviceBadge(image.device_type)}
                    <Badge variant={image.is_active ? "default" : "secondary"}>
                      {image.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant="outline">Ordre: {image.display_order}</Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleActive(image.id, image.is_active)}
                  >
                    {image.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image.id, image.image_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
