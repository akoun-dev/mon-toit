import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { logger } from '@/services/logger';
import { supabase } from '@/lib/supabase';
import { celebrateCertification } from '@/utils/confetti';
import { AlertCircle, Shield } from 'lucide-react';
import { compressImage, validateImage, SimpleProgress, MAX_IMAGE_SIZE } from '@/utils/imageUtils';
import { VerificationResultDisplay } from './VerificationResultDisplay';
import { VerificationInstructions } from './VerificationInstructions';
import { CNIUploadZone } from './CNIUploadZone';
import { SelfieCapture } from './SelfieCapture';
import { VerificationButtons } from './VerificationButtons';

interface CNIBFormProps {
  onSubmit?: () => void;
}

const CNIBForm = ({ onSubmit }: CNIBFormProps = {}) => {
  const { user } = useAuth();
  const [captureMethod, setCaptureMethod] = useState<'local' | 'popup'>('popup');
  const [cniImage, setCniImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Nouveaux states pour NeoFace
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState('');
  const [pollingTimeout, setPollingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    similarityScore: string;
    message: string;
    canRetry: boolean;
    resultText?: string;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      logger.debug('Nettoyage composant CNIBForm');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.debug('Track arrêté', { label: track.label });
        });
        streamRef.current = null;
      }
      if (pollingTimeout) {
        clearInterval(pollingTimeout);
      }
    };
  }, [pollingTimeout]);

  const startCamera = async () => {
    try {
      logger.info('Démarrage de la caméra');
      setIsVideoLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('L\'API MediaDevices n\'est pas supportée par ce navigateur');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      logger.debug('Stream vidéo obtenu', { settings: stream.getVideoTracks()[0].getSettings() });
      
      if (!videoRef.current) {
        throw new Error('Référence vidéo non disponible');
      }

      const video = videoRef.current;
      streamRef.current = stream;
      
      // IMPORTANT: Définir srcObject APRÈS avoir configuré les événements
      const playPromise = new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          logger.debug('Vidéo prête (canplay)', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsCapturing(true);
            setIsVideoLoading(false);
            logger.info('Caméra prête à capturer');
            toast.success('Caméra activée !', { 
              description: 'Positionnez votre visage au centre' 
            });
            resolve();
          }
        };

        const onError = (e: Event) => {
          logger.error('Erreur vidéo', { error: e });
          reject(new Error('Erreur de chargement de la vidéo'));
        };

        // Utiliser 'canplay' au lieu de 'loadedmetadata' (plus fiable)
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', onError, { once: true });
        
        // Timeout de sécurité
        setTimeout(() => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          
          // Vérifier manuellement si la vidéo est prête
          if (video.readyState >= 2 && video.videoWidth > 0) {
            logger.debug('Timeout mais vidéo prête', {
              readyState: video.readyState,
              width: video.videoWidth,
              height: video.videoHeight
            });
            setIsCapturing(true);
            setIsVideoLoading(false);
            toast.success('Caméra activée !');
            resolve();
          } else {
            logger.error('Timeout: vidéo non prête', {
              readyState: video.readyState,
              width: video.videoWidth,
              height: video.videoHeight
            });
            reject(new Error('La vidéo n\'a pas pu se charger'));
          }
        }, 5000);
      });

      // Assigner le stream à la vidéo
      video.srcObject = stream;
      
      // Forcer le play (nécessaire sur certains navigateurs)
      try {
        await video.play();
        logger.debug('video.play() appelé avec succès');
      } catch (playError) {
        logger.warn('video.play() a échoué (peut-être déjà en lecture)', { error: playError });
      }

      await playPromise;
    } catch (error) {
      logger.error('Error accessing camera', { error });
      setIsVideoLoading(false);
      setIsCapturing(false);
      
      let errorMessage = 'Impossible d\'accéder à la caméra';
      let errorDescription = 'Vérifiez vos permissions et réessayez';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Autorisation caméra refusée';
          errorDescription = 'Autorisez l\'accès à la caméra dans les paramètres de votre navigateur';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée';
          errorDescription = 'Vérifiez qu\'une caméra est connectée à votre appareil';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'La caméra est déjà utilisée';
          errorDescription = 'Fermez les autres applications utilisant la caméra';
        } else if (error.message.includes('Timeout') || error.message.includes('charger')) {
          errorMessage = 'La caméra n\'a pas pu se charger';
          errorDescription = 'Réessayez ou rechargez la page';
        }
      }
      
      toast.error(errorMessage, { description: errorDescription });
      
      // Nettoyer le stream en cas d'erreur
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.debug('Track arrêté (erreur)', { label: track.label });
        });
        streamRef.current = null;
      }
    }
  };

  const stopCamera = useCallback(() => {
    logger.debug('Arrêt de la caméra');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setIsVideoLoading(false);
  }, []);

  const captureSelfie = () => {
    logger.debug('Tentative de capture du selfie');
    
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Erreur de capture', { description: 'Références vidéo manquantes' });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Vérifier que la vidéo a des dimensions valides
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      logger.error('Dimensions vidéo invalides', {
        width: video.videoWidth,
        height: video.videoHeight
      });
      toast.error('Vidéo non prête', { 
        description: 'Attendez que la caméra charge complètement' 
      });
      return;
    }

    // Vérifier que le stream est actif
    if (!streamRef.current || streamRef.current.getTracks().length === 0) {
      logger.error('Aucun stream actif');
      toast.error('Caméra inactive', { 
        description: 'Relancez la caméra et réessayez' 
      });
      return;
    }

    logger.debug('Capture du selfie', {
      width: video.videoWidth,
      height: video.videoHeight
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setSelfieImage(imageData);
      stopCamera();
      logger.info('Selfie capturé avec succès');
      toast.success('Selfie capturé !');
    } else {
      logger.error('Impossible d\'obtenir le contexte canvas');
      toast.error('Erreur de capture', { description: 'Impossible de traiter l\'image' });
    }
  };

  const handleCniUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      logger.debug('Aucun fichier sélectionné');
      return;
    }

    logger.debug('Fichier sélectionné', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // Validation
    const validation = validateImage(file);
    if (!validation.valid) {
      logger.error('Validation échouée', { error: validation.error });
      toast.error('Fichier invalide', { description: validation.error });
      event.target.value = ''; // Reset input
      return;
    }

    logger.debug('Validation réussie, début de la lecture');
    setUploadProgress(0);
    
    try {
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
          logger.debug(`Progression upload: ${progress.toFixed(1)}%`);
        }
      };

      reader.onloadend = async () => {
        try {
          logger.debug('Fichier chargé, début de la compression');
          let imageData = reader.result as string;
          
          const originalSize = (imageData.length * 3) / 4 / 1024 / 1024;
          logger.debug(`Taille originale: ${originalSize.toFixed(2)}MB`);
          
          // Compresser l'image
          imageData = await compressImage(imageData);
          
          const compressedSize = (imageData.length * 3) / 4 / 1024 / 1024;
          logger.debug(`Taille compressée: ${compressedSize.toFixed(2)}MB`);
          
          logger.debug('setCniImage appelé avec image compressée');
          setCniImage(imageData);
          setUploadProgress(100);
          
          toast.success('Photo de CNI chargée !', {
            description: `Taille: ${compressedSize.toFixed(2)}MB`
          });
          
          // Reset progress après 1 seconde
          setTimeout(() => {
            setUploadProgress(0);
            logger.debug('Progress bar réinitialisée');
          }, 1000);
        } catch (error) {
          logger.error('Erreur de compression', { error });
          toast.error('Erreur de traitement', {
            description: 'Impossible de traiter l\'image'
          });
          setUploadProgress(0);
        }
      };

      reader.onerror = (error) => {
        logger.error('Erreur de lecture du fichier', { error });
        toast.error('Erreur de lecture', {
          description: 'Impossible de lire le fichier'
        });
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Erreur lors du chargement', { error });
      toast.error('Erreur', {
        description: 'Impossible de charger le fichier'
      });
      setUploadProgress(0);
    }
    
    // Reset input pour permettre le re-upload du même fichier
    event.target.value = '';
  }, []);

  const handleLocalVerify = async () => {
    if (!cniImage || !selfieImage) {
      toast.error('Veuillez fournir une photo de votre CNIB et un selfie');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      setUploadProgress(20);
      logger.info('🚀 Début vérification locale avec caméra navigateur');
      
      // Upload CNIB vers Storage
      const cniBlob = await fetch(cniImage).then(r => r.blob());
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('verification-documents')
        .upload(`${user.id}/cnib-${Date.now()}.jpg`, cniBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (storageError) throw storageError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(storageData.path);
      
      setUploadProgress(40);
      logger.info('✅ CNIB uploadée', { url: publicUrl });
      
      // Appeler edge function avec action local_verification
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('neoface-verification', {
        body: { 
          action: 'local_verification',
          cni_photo_url: publicUrl,
          selfie_base64: selfieImage,
          user_id: user.id
        }
      });
      
      setUploadProgress(80);
      
      if (verificationError) throw verificationError;
      if (!verificationData.success) throw new Error(verificationData.error || 'Échec de la vérification');
      
      setUploadProgress(100);
      
      // Résultat immédiat
      setVerificationResult({
        verified: verificationData.verified,
        similarityScore: verificationData.matching_score.toString(),
        message: verificationData.verified ? '✅ Vérification biométrique réussie !' : 'La vérification a échoué',
        canRetry: !verificationData.verified
      });
      
      if (verificationData.verified) {
        celebrateCertification();
        toast.success('🎉 Certification DONIA réussie !', {
          description: `Score de correspondance : ${verificationData.matching_score}% • Vous êtes maintenant certifié DONIA`,
          duration: 5000,
        });
        onSubmit?.();
      } else {
        toast.error('Vérification échouée', {
          description: verificationData.message || 'Réessayez avec de meilleures conditions'
        });
      }
      
      logger.info('✅ Vérification locale terminée', { verified: verificationData.verified });
      
    } catch (error) {
      logger.error('Erreur vérification locale', { error });
      
      setVerificationResult({
        verified: false,
        similarityScore: '0',
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
        canRetry: true
      });
      
      toast.error('Erreur lors de la vérification', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setIsVerifying(false);
      setUploadProgress(0);
    }
  };

  const handleVerify = async () => {
    if (!cniImage) {
      toast.error('Veuillez fournir une photo de votre CNIB');
      return;
    }

    if (!user) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // ========================================
      // ÉTAPE 1 : Upload CNIB vers Supabase Storage
      // ========================================
      setIsUploadingDocument(true);
      setUploadProgress(20);
      logger.info('📤 Upload CNIB vers Storage...');
      
      // Convertir base64 en Blob
      const cniBlob = await fetch(cniImage).then(r => r.blob());
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('verification-documents')
        .upload(`${user.id}/cnib-${Date.now()}.jpg`, cniBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (storageError) throw storageError;
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(storageData.path);
      
      setUploadProgress(40);
      logger.info('✅ CNIB uploadée', { url: publicUrl });
      
      // ========================================
      // ÉTAPE 2 : Appeler NeoFace upload_document
      // ========================================
      logger.info('📡 Appel NeoFace upload_document...');
      
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('neoface-verification', {
        body: { 
          action: 'upload_document', 
          cni_photo_url: publicUrl,
          user_id: user.id 
        }
      });
      
      if (uploadError) throw uploadError;
      if (!uploadData.success) throw new Error(uploadData.error || 'Échec upload document');
      
      setDocumentId(uploadData.document_id);
      setSelfieUrl(uploadData.selfie_url);
      setUploadProgress(60);
      setIsUploadingDocument(false);
      
      logger.info('✅ Document uploadé sur NeoFace', { 
        document_id: uploadData.document_id,
        selfie_url: uploadData.selfie_url 
      });
      
      // ========================================
      // ÉTAPE 3 : Ouvrir fenêtre selfie NeoFace
      // ========================================
      toast.success('📸 Fenêtre selfie ouverte', {
        description: 'Prenez votre selfie dans la nouvelle fenêtre'
      });
      
      const selfieWindow = window.open(uploadData.selfie_url, '_blank', 'width=600,height=800');
      if (!selfieWindow) {
        toast.error('Popup bloquée', {
          description: 'Autorisez les popups et réessayez'
        });
        throw new Error('Popup bloquée');
      }
      
      setUploadProgress(70);
      
      // ========================================
      // ÉTAPE 4 : Polling du statut (toutes les 3 secondes)
      // ========================================
      setIsPolling(true);
      setPollingMessage('En attente de votre selfie...');
      logger.info('🔄 Début du polling...');
      
      let attempts = 0;
      const maxAttempts = 100; // 5 minutes (100 * 3 secondes)
      
      const pollInterval = setInterval(async () => {
        attempts++;
        const minutes = Math.floor(attempts * 3 / 60);
        const seconds = (attempts * 3 % 60).toString().padStart(2, '0');
        setPollingMessage(`En attente de votre selfie... (${minutes}:${seconds})`);
        
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('neoface-verification', {
            body: { 
              action: 'check_status', 
              document_id: uploadData.document_id 
            }
          });
          
          if (statusError) {
            logger.error('Erreur polling', { error: statusError });
            return; // Continue polling
          }
          
          logger.debug('Polling status', { status: statusData.status, attempt: attempts });
          
          if (statusData.status === 'verified') {
            // ✅ SUCCÈS !
            clearInterval(pollInterval);
            setIsPolling(false);
            setUploadProgress(100);
            
            setVerificationResult({
              verified: true,
              similarityScore: statusData.matching_score.toString(),
              message: '✅ Vérification biométrique réussie !',
              canRetry: false
            });
            
            // 🎉 Célébration DONIA
            celebrateCertification();
            
            toast.success('🎉 Certification DONIA réussie !', {
              description: `Score de correspondance : ${statusData.matching_score}% • Vous êtes maintenant certifié DONIA`,
              duration: 5000,
            });
            
            logger.info('✅ Vérification NeoFace réussie', { 
              matching_score: statusData.matching_score 
            });
            
            onSubmit?.();
            
          } else if (statusData.status === 'failed') {
            // ❌ ÉCHEC
            clearInterval(pollInterval);
            setIsPolling(false);
            
            setVerificationResult({
              verified: false,
              similarityScore: statusData.matching_score?.toString() || '0',
              message: statusData.message || 'La vérification a échoué',
              canRetry: true
            });
            
            toast.error('Vérification échouée', {
              description: statusData.message || 'Réessayez avec de meilleures conditions'
            });
            
            logger.warn('❌ Vérification NeoFace échouée', { 
              message: statusData.message 
            });
          }
          // Si status === 'waiting', continue polling
          
        } catch (pollError) {
          logger.error('Erreur durant le polling', { error: pollError });
          // Continue polling malgré l'erreur
        }
        
        // Timeout après maxAttempts
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setIsPolling(false);
          
          toast.error('Délai expiré', {
            description: 'La vérification a pris trop de temps. Réessayez.'
          });
          
          setVerificationResult({
            verified: false,
            similarityScore: '0',
            message: 'Délai d\'attente expiré (5 minutes)',
            canRetry: true
          });
        }
        
      }, 3000); // Polling toutes les 3 secondes
      
      // Stocker le timeout pour nettoyage
      setPollingTimeout(pollInterval);
      
    } catch (error) {
      logger.error('Erreur vérification NeoFace', { error });
      
      setVerificationResult({
        verified: false,
        similarityScore: '0',
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
        canRetry: true
      });
      
      toast.error('Erreur lors de la vérification', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      
    } finally {
      setIsVerifying(false);
      setIsUploadingDocument(false);
      setUploadProgress(0);
    }
  };

  const reset = () => {
    setCniImage(null);
    setSelfieImage(null);
    setVerificationResult(null);
    stopCamera();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Vérification CNIB (Burkinabè)
        </CardTitle>
        <CardDescription>
          Vérification biométrique sécurisée avec votre CNIB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VerificationInstructions />

        {/* Sélecteur de méthode de capture */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <Label className="text-base font-semibold">Méthode de capture du selfie</Label>
          <RadioGroup value={captureMethod} onValueChange={(value) => setCaptureMethod(value as 'local' | 'popup')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="popup" id="popup" />
              <Label htmlFor="popup" className="font-normal cursor-pointer">
                NeoFace Popup (recommandé) - Fenêtre sécurisée automatique
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="font-normal cursor-pointer">
                Caméra locale - Capture directe dans le navigateur
              </Label>
            </div>
          </RadioGroup>
        </div>

        {isUploadingDocument && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">📤 Upload de votre CNIB en cours...</p>
                <SimpleProgress value={uploadProgress} className="mt-2" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isPolling && (
          <Alert>
            <AlertCircle className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">⏳ {pollingMessage}</p>
                <p className="text-sm text-muted-foreground">
                  Une fenêtre s'est ouverte pour prendre votre selfie. 
                  Si vous ne la voyez pas, vérifiez les popups bloquées.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <CNIUploadZone
            image={cniImage}
            uploadProgress={uploadProgress}
            onUpload={handleCniUpload}
            onRemove={() => {
              setCniImage(null);
              setVerificationResult(null);
            }}
            disabled={isVerifying}
          />

          <SelfieCapture
            method={captureMethod}
            selfieImage={selfieImage}
            isCapturing={isCapturing}
            isVideoLoading={isVideoLoading}
            isVerifying={isVerifying}
            videoRef={videoRef}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onCapture={captureSelfie}
            onRemove={() => {
              setSelfieImage(null);
              setVerificationResult(null);
            }}
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {verificationResult && (
          <VerificationResultDisplay result={verificationResult} />
        )}

        <VerificationButtons
          captureMethod={captureMethod}
          canVerify={!!(cniImage && (captureMethod === 'popup' || selfieImage)) && uploadProgress === 0}
          isVerifying={isVerifying}
          isPolling={isPolling}
          pollingMessage={pollingMessage}
          hasContent={!!(cniImage || selfieImage || verificationResult)}
          onVerify={captureMethod === 'local' ? handleLocalVerify : handleVerify}
          onReset={reset}
        />

        <Alert className="bg-muted">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Sécurité et confidentialité :</strong> Vos images sont transmises de manière sécurisée à NeoFace 
            pour vérification biométrique. Seul le résultat de vérification (score de correspondance) est conservé dans votre profil.
            La capture du selfie se fait dans une fenêtre sécurisée NeoFace qui s'ouvrira automatiquement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CNIBForm;
