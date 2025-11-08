import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { compressImage, validateImage } from "@/utils/imageUtils";

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  alt_text: z.string().min(5, "Le texte alternatif doit contenir au moins 5 caractères"),
  device_type: z.enum(["desktop", "mobile", "both"]),
  display_order: z.number().min(0),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface HeroImageUploadDialogProps {
  onSuccess: () => void;
}

export function HeroImageUploadDialog({ onSuccess }: HeroImageUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      alt_text: "",
      device_type: "both",
      display_order: 0,
      is_active: true,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || "Fichier invalide");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onSubmit = async (values: FormData) => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setUploading(true);

    try {
      // Lire et compresser l'image
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise((resolve) => {
        reader.onload = async () => {
          try {
            // Compresser l'image
            const compressed = await compressImage(reader.result as string, 85);
            
            // Upload vers Supabase Storage
            const fileName = `${crypto.randomUUID()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('hero-images')
              .upload(fileName, compressed);

            if (uploadError) throw uploadError;

            // Obtenir l'URL publique
            const { data: { publicUrl } } = supabase.storage
              .from('hero-images')
              .getPublicUrl(fileName);

            // Insérer les métadonnées dans la table
            const { error: insertError } = await supabase
              .from('hero_carousel_images')
              .insert({
                title: values.title,
                alt_text: values.alt_text,
                image_url: publicUrl,
                display_order: values.display_order,
                device_type: values.device_type,
                is_active: values.is_active,
              });

            if (insertError) throw insertError;

            toast.success("Image uploadée avec succès");
            setOpen(false);
            form.reset();
            setSelectedFile(null);
            setPreviewUrl(null);
            onSuccess();
            resolve(null);
          } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'upload");
            resolve(null);
          }
        };
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Ajouter une image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une image Hero</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {previewUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Formats: JPG, PNG, WebP • Max 5MB • Recommandé: 1920x1080 (desktop), 800x600 (mobile)
              </p>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Villa moderne à Ouagadougou" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alt_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte alternatif (accessibilité)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Architecture moderne à Ouagadougou" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="device_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device cible</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="both">Les deux (Desktop & Mobile)</SelectItem>
                      <SelectItem value="desktop">Desktop uniquement</SelectItem>
                      <SelectItem value="mobile">Mobile uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordre d'affichage</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Activer immédiatement</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? "Upload en cours..." : "Uploader"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
