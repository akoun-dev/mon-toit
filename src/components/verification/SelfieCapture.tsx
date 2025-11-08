import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useFaceQualityDetection } from '@/hooks/useFaceQualityDetection';
import { QualityOverlay } from './QualityOverlay';
import { useEffect } from 'react';

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
  // Désactivé temporairement pour déboguer le problème de caméra
  // const { 
  //   quality: qualityMetrics, 
  //   isAnalyzing, 
  //   isLoading,
  //   startAnalysis,
  //   stopAnalysis 
  // } = useFaceQualityDetection(videoRef);

  // useEffect(() => {
  //   if (isCapturing && videoRef.current) {
  //     startAnalysis();
  //   } else {
  //     stopAnalysis();
  //   }

  //   return () => stopAnalysis();
  // }, [isCapturing, startAnalysis, stopAnalysis]);

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
              {!isCapturing && !isVideoLoading && !selfieImage && (
                <Button
                  onClick={onStartCamera}
                  disabled={isVerifying}
                  className="w-full"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Démarrer la caméra
                </Button>
              )}

              {(isCapturing || isVideoLoading) && !selfieImage && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-muted border-2 border-primary/20">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover bg-black"
                      style={{ minHeight: '256px' }}
                    />
                    
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                        <div className="text-center bg-background/90 rounded-lg p-6 shadow-lg">
                          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
                          <p className="text-sm font-medium">Activation de la caméra...</p>
                          <p className="text-xs text-muted-foreground mt-1">Autorisez l'accès si demandé</p>
                          {/* Indicateur de debug */}
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground font-mono">
                              Dimensions: {videoRef.current?.videoWidth || 0} × {videoRef.current?.videoHeight || 0}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              ReadyState: {videoRef.current?.readyState || 0} / 4
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              CSS: {videoRef.current?.clientWidth || 0} × {videoRef.current?.clientHeight || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay ML désactivé temporairement */}
                    {/* {isCapturing && (
                      <QualityOverlay 
                        quality={qualityMetrics}
                        isActive={isAnalyzing}
                        isLoading={isLoading}
                      />
                    )} */}
                  </div>
                  {isCapturing && (
                    <div className="flex gap-2">
                      <Button
                        onClick={onCapture}
                        className="flex-1"
                        size="lg"
                        // disabled={qualityMetrics?.overallQuality !== 'good'}
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
                  )}
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
