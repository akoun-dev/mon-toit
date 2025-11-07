import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface SelfieCaptureProps {
  method: 'local' | 'popup';
  selfieImage: string | null;
  isCapturing: boolean;
  isVideoLoading: boolean;
  isVerifying: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
  onRemove: () => void;
}

export const SelfieCapture = ({
  method,
  selfieImage,
  isCapturing,
  isVideoLoading,
  isVerifying,
  videoRef,
  onStartCamera,
  onStopCamera,
  onCapture,
  onRemove,
}: SelfieCaptureProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        2. Selfie de vérification
      </Label>

      <Card className="overflow-hidden border-2">
        <CardContent className="p-6">
          {method === 'popup' ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Le selfie sera capturé via la fenêtre NeoFace après validation.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {!isCapturing && !selfieImage && (
                <Button
                  onClick={onStartCamera}
                  disabled={isVideoLoading || isVerifying}
                  className="w-full"
                  size="lg"
                >
                  {isVideoLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-5 w-5" />
                      Démarrer la caméra
                    </>
                  )}
                </Button>
              )}

              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onCapture}
                      className="flex-1"
                      size="lg"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Capturer
                    </Button>
                    <Button
                      onClick={onStopCamera}
                      variant="outline"
                      size="lg"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {selfieImage && (
                <div className="relative group">
                  <img
                    src={selfieImage}
                    alt="Selfie"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onRemove}
                      disabled={isVerifying}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
