import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { logger } from '@/services/logger';
import { supabase } from '@/lib/supabase';
import { celebrateCertification } from '@/utils/confetti';
import { AlertCircle, Shield, Info } from 'lucide-react';
import { compressImage, validateImage, SimpleProgress, MAX_IMAGE_SIZE } from '@/utils/imageUtils';
import { VerificationResultDisplay } from './VerificationResultDisplay';
import { VerificationInstructions } from './VerificationInstructions';
import { CNIUploadZone } from './CNIUploadZone';
import { VerificationButtons } from './VerificationButtons';
import { VerificationStepper } from './VerificationStepper';
import { triggerUserFeedback } from '@/utils/userFeedback';
import { preloadNotificationSounds } from '@/utils/notifications';
import { useCamera } from '@/hooks/useCamera';
import { SelfieCapture } from './SelfieCapture';

interface CNIBFormProps {
  onSubmit?: () => void;
}

const CNIBForm = ({ onSubmit }: CNIBFormProps = {}) => {
  const { user } = useAuth();
  const [captureMethod, setCaptureMethod] = useState<'local' | 'popup'>('local');
  const camera = useCamera();
  const [cniImage, setCniImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Nouveaux states pour NeoFace
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  
  // State pour le stepper de progression
  const [verificationStep, setVerificationStep] = useState<{
    current: number;
    status: 'idle' | 'uploading' | 'selfie' | 'verifying' | 'completed' | 'error';
    progress: number;
    message: string;
  }>({
    current: 0,
    status: 'idle',
    progress: 0,
    message: ''
  });
  
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    similarityScore: string;
    message: string;
    canRetry: boolean;
    resultText?: string;
  } | null>(null);
  
  // Preload audio on mount
  useEffect(() => {
    preloadNotificationSounds();
  }, []);

  // Hook polling
  const polling = usePolling(
    async (documentId: string) => {
      const { data, error } = await supabase.functions.invoke('neoface-verification', {
        body: { 
          action: 'check_status', 
          document_id: documentId 
        }
      });
      
      if (error) throw error;
      return data;
    },
    {
      interval: 3000,
      maxAttempts: 100,
      onSuccess: async (data) => {
        setVerificationStep({
          current: 3,
          status: 'completed',
          progress: 100,
          message: 'Vérification réussie !'
        });
        
        // 🎵 Trigger success feedback
        await triggerUserFeedback('success');
        
        setVerificationResult({
          verified: true,
          similarityScore: data.matching_score.toString(),
          message: '✅ Vérification biométrique réussie !',
          canRetry: false
        });
        celebrateCertification();
        toast.success('🎉 Certification DONIA réussie !', {
          description: `Score de correspondance : ${data.matching_score}% • Vous êtes maintenant certifié DONIA`,
          duration: 5000,
        });
        logger.info('✅ Vérification NeoFace réussie', { matching_score: data.matching_score });
        onSubmit?.();
      },
      onError: async (data) => {
        setVerificationStep(prev => ({
          ...prev,
          status: 'error',
          message: data.message || 'La vérification a échoué'
        }));
        
        // 🎵 Trigger error feedback
        await triggerUserFeedback('error');
        
        setVerificationResult({
          verified: false,
          similarityScore: data.matching_score?.toString() || '0',
          message: data.message || 'La vérification a échoué',
          canRetry: true
        });
        toast.error('Vérification échouée', {
          description: data.message || 'Réessayez avec de meilleures conditions'
        });
        logger.warn('❌ Vérification NeoFace échouée', { message: data.message });
      },
      onTimeout: () => {
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
    }
  );

  const { isPolling, message: pollingMessage, startPolling, stopPolling } = polling;

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
    setVerificationStep({
      current: 1,
      status: 'uploading',
      progress: 0,
      message: 'Préparation de votre document...'
    });

    try {
      // ========================================
      // ÉTAPE 1 : Upload CNIB vers Supabase Storage
      // ========================================
      setIsUploadingDocument(true);
      setUploadProgress(20);
      setVerificationStep(prev => ({ ...prev, progress: 20, message: 'Upload vers le serveur...' }));
      logger.info('📤 Upload CNIB vers Storage...');
      
      // Convertir base64 en Blob
      const cniBlob = await fetch(cniImage).then(r => r.blob());
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('verification-documents')
        .upload(`${user.id}/cnib-${Date.now()}.jpg`, cniBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (storageError) {
        logger.error('Erreur upload Storage:', { message: storageError.message });
        throw storageError;
      }
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(storageData.path);
      
      setUploadProgress(40);
      setVerificationStep(prev => ({ ...prev, progress: 40, message: 'Document uploadé, envoi à NeoFace...' }));
      
      // 🎵 Trigger upload complete feedback
      await triggerUserFeedback('upload_complete');
      
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
      
      if (uploadError) {
        logger.error('Erreur appel edge function:', { message: uploadError.message });
        throw new Error(`Erreur serveur: ${uploadError.message}`);
      }
      
      if (!uploadData) {
        logger.error('Pas de données retournées par edge function');
        throw new Error('Aucune réponse du serveur');
      }
      
      if (!uploadData.success) {
        logger.error('Edge function a retourné success=false:', uploadData);
        throw new Error(uploadData.error || 'Échec upload document');
      }
      
      if (!uploadData.document_id || !uploadData.url) {
        logger.error('Données manquantes dans la réponse:', uploadData);
        throw new Error('Réponse serveur incomplète (document_id ou url manquant)');
      }
      
      setDocumentId(uploadData.document_id);
      setSelfieUrl(uploadData.url);
      setUploadProgress(60);
      setIsUploadingDocument(false);
      setVerificationStep({
        current: 2,
        status: 'selfie',
        progress: 60,
        message: 'En attente de votre selfie...'
      });
      
      // 🎵 Trigger step change feedback
      await triggerUserFeedback('step_change');
      
      logger.info('📡 Réponse NeoFace upload_document:', {
        success: uploadData.success,
        document_id: uploadData.document_id,
        url_exists: !!uploadData.url,
        url_preview: uploadData.url ? uploadData.url.substring(0, 80) : 'MANQUANTE',
        has_selfie_url: !!uploadData.selfie_url
      });
      
      logger.info('✅ Document uploadé sur NeoFace', { 
        document_id: uploadData.document_id,
        selfie_url: uploadData.url.substring(0, 50) + '...'
      });
      
      // ========================================
      // ÉTAPE 3 : Capture selfie (local ou popup)
      // ========================================
      
      if (captureMethod === 'local') {
        // Mode local: attendre que l'utilisateur capture son selfie
        logger.info('📸 Mode capture locale activé');
        
        // La capture est déjà gérée par le composant SelfieCapture
        // On attend simplement que camera.capturedImage soit défini
        const waitForSelfie = () => new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (camera.capturedImage) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
          
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!camera.capturedImage) {
              reject(new Error('Timeout: selfie non capturé'));
            }
          }, 300000); // 5 minutes timeout
        });
        
        await waitForSelfie();
        
        // Uploader le selfie vers Supabase Storage
        logger.info('📤 Upload du selfie local...');
        const selfieBlob = await fetch(camera.capturedImage).then(r => r.blob());
        const selfieFileName = `${user.id}/selfie-${Date.now()}.jpg`;
        
        const { data: selfieStorage, error: selfieError } = await supabase.storage
          .from('verification-documents')
          .upload(selfieFileName, selfieBlob, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (selfieError) {
          throw new Error(`Erreur upload selfie: ${selfieError.message}`);
        }
        
        const { data: { publicUrl: selfiePublicUrl } } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(selfieStorage.path);
        
        logger.info('✅ Selfie local uploadé', { url: selfiePublicUrl });
        
        setUploadProgress(70);
        setVerificationStep(prev => ({ 
          ...prev, 
          progress: 70, 
          message: 'Selfie capturé et uploadé' 
        }));
        
      } else {
        // Mode popup NeoFace
        // Vérifier que l'URL NeoFace est disponible
        if (!uploadData.url) {
          logger.error('❌ URL NeoFace manquante dans la réponse serveur', { uploadData });
          throw new Error('URL NeoFace manquante dans la réponse serveur');
        }
        
        logger.info('🪟 Ouverture fenêtre NeoFace...', { 
          url_preview: uploadData.url.substring(0, 60) + '...' 
        });
        
        setVerificationStep(prev => ({ 
          ...prev, 
          progress: 65, 
          message: 'Ouverture de la fenêtre NeoFace...' 
        }));
        
        const selfieWindow = window.open(
          uploadData.url, // ✅ Correction: utiliser uploadData.url au lieu de uploadData.selfie_url
          'neoface-selfie',
          'width=600,height=800,resizable=yes,scrollbars=yes'
        );
        
        if (!selfieWindow) {
          logger.error('Popup NeoFace bloquée par le navigateur');
          
          toast.error('Popup bloquée', {
            description: 'Veuillez autoriser les popups pour ce site dans les paramètres de votre navigateur',
            duration: 10000
          });
          
          // Proposer le mode local comme fallback
          if (window.confirm('La popup NeoFace est bloquée. Voulez-vous essayer la capture locale ?')) {
            setCaptureMethod('local');
            setVerificationStep({
              current: 2,
              status: 'selfie',
              progress: 60,
              message: 'En attente de votre selfie...'
            });
            return; // Sortir pour permettre à l'utilisateur de capturer en local
          }
          
          throw new Error('Popup bloquée par le navigateur');
        }
        
        toast.success('📸 Fenêtre NeoFace prête', {
          description: 'Prenez votre selfie dans la nouvelle fenêtre. La vérification démarrera automatiquement.',
          duration: 5000
        });
        
        setUploadProgress(70);
        setVerificationStep(prev => ({ 
          ...prev, 
          progress: 70, 
          message: 'Prenez votre selfie dans la fenêtre NeoFace' 
        }));
      }
      
      // ========================================
      // ÉTAPE 4 : Attendre 3 secondes puis démarrer le polling
      // ========================================
      logger.info('⏳ Attente de 3 secondes avant polling...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setVerificationStep({
        current: 3,
        status: 'verifying',
        progress: 80,
        message: 'Analyse biométrique en cours...'
      });
      
      // 🎵 Trigger processing start feedback
      await triggerUserFeedback('processing_start');
      
      logger.info('🔄 Démarrage du polling...');
      startPolling(uploadData.document_id);
      
    } catch (error) {
      logger.error('Erreur vérification NeoFace', { error });
      
      setVerificationStep(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      }));
      
      // 🎵 Trigger error feedback
      await triggerUserFeedback('error');
      
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
    setVerificationResult(null);
    camera.reset();
    setVerificationStep({
      current: 0,
      status: 'idle',
      progress: 0,
      message: ''
    });
    stopPolling();
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
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Méthode de capture du selfie</Label>
          <RadioGroup 
            value={captureMethod} 
            onValueChange={(value) => setCaptureMethod(value as 'local' | 'popup')}
            disabled={isVerifying || isPolling}
            className="space-y-2"
          >
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-background/50 transition-colors">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="cursor-pointer font-normal flex-1">
                <span className="font-medium">📷 Capture dans l'application</span>
                <p className="text-xs text-muted-foreground mt-1">Contrôle total sur votre caméra (Recommandé)</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-background/50 transition-colors">
              <RadioGroupItem value="popup" id="popup" />
              <Label htmlFor="popup" className="cursor-pointer font-normal flex-1">
                <span className="font-medium">🪟 Capture via fenêtre NeoFace</span>
                <p className="text-xs text-muted-foreground mt-1">Interface sécurisée certifiée avec validation automatique</p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Info sur la méthode NeoFace (si popup) */}
        {captureMethod === 'popup' && (
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <p className="font-medium text-primary mb-1">Interface NeoFace avec validation native</p>
              <p className="text-sm text-muted-foreground">
                • Détection automatique de visage et qualité d'image<br/>
                • Vérification des clignements d'yeux (liveness)<br/>
                • Capture automatique optimale<br/>
                • Interface sécurisée certifiée
              </p>
            </AlertDescription>
          </Alert>
        )}

        {(isVerifying || isPolling) && verificationStep.current > 0 && (
          <VerificationStepper
            currentStep={verificationStep.current}
            progress={verificationStep.progress}
            message={verificationStep.message}
            status={verificationStep.status}
          />
        )}

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

        {/* Afficher SelfieCapture en mode local pendant l'étape selfie */}
        {captureMethod === 'local' && verificationStep.status === 'selfie' && (
          <SelfieCapture
            method="local"
            selfieImage={camera.capturedImage}
            isCapturing={camera.isCapturing}
            isVideoLoading={camera.isVideoLoading}
            isVerifying={isVerifying}
            error={camera.error}
            videoRef={camera.videoRef}
            canvasRef={camera.canvasRef}
            onStartCamera={camera.startCamera}
            onStopCamera={camera.stopCamera}
            onCapture={camera.capture}
            onRemove={camera.reset}
          />
        )}

        {captureMethod === 'popup' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le selfie sera capturé via l'interface NeoFace sécurisée après validation. Celle-ci inclut la détection automatique de visage, la vérification de qualité et les clignements d'yeux.
            </AlertDescription>
          </Alert>
        )}

        {verificationResult && (
          <VerificationResultDisplay result={verificationResult} />
        )}

        <VerificationButtons
          captureMethod={captureMethod}
          canVerify={!!cniImage && uploadProgress === 0}
          isVerifying={isVerifying}
          isPolling={isPolling}
          pollingMessage={pollingMessage}
          hasContent={!!(cniImage || verificationResult)}
          onVerify={handleVerify}
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
