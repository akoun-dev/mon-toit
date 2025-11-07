import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CNIUploadZoneProps {
  image: string | null;
  uploadProgress: number;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const CNIUploadZone = ({ 
  image, 
  uploadProgress, 
  onUpload, 
  onRemove, 
  disabled = false 
}: CNIUploadZoneProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        1. Photo de votre Carte Nationale d'Identité Burkinabè (CNIB)
      </Label>
      
      <Card className="overflow-hidden border-2 border-dashed hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          {!image ? (
            <label 
              htmlFor="cni-upload" 
              className={`flex flex-col items-center justify-center cursor-pointer space-y-3 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Cliquez pour télécharger</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG jusqu'à 5MB</p>
              </div>
              <input
                id="cni-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
                disabled={disabled}
              />
            </label>
          ) : (
            <div className="relative group">
              <img
                src={image}
                alt="CNIB"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Chargée
              </div>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Téléchargement... {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
