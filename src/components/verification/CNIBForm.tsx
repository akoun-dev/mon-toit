import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePolling } from '@/hooks/usePolling';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import { logger } from '@/services/logger';
import { supabase } from '@/lib/supabase';
import { celebrateCertification } from '@/utils/confetti';
import { AlertCircle, Shield, Info, CheckCircle, Loader2 as Loader2Icon } from 'lucide-react';
import { compressImage, validateImage, SimpleProgress, MAX_IMAGE_SIZE } from '@/utils/imageUtils';
import { VerificationResultDisplay } from './VerificationResultDisplay';
import { VerificationInstructions } from './VerificationInstructions';
import { CNIUploadZone } from './CNIUploadZone';
import { VerificationButtons } from './VerificationButtons';
import { VerificationStepper } from './VerificationStepper';
import { triggerUserFeedback } from '@/utils/userFeedback';
import { preloadNotificationSounds } from '@/utils/notifications';

interface CNIBFormProps {
  onSubmit?: () => void;
}

const CNIBForm = ({ onSubmit }: CNIBFormProps = {}) => {
  const { user } = useAuth();
  const [cniImage, setCniImage] = useState<string | null>(null);
  const [neoFaceWindow, setNeoFaceWindow] = useState<Window | null>(null);
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
    // Validation initiale
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
      // Upload CNIB et redirection vers NeoFace
      // ========================================
      setVerificationStep({
        current: 1,
        status: 'uploading',
        progress: 0,
        message: 'Préparation de votre document...'
      });

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
      
      await triggerUserFeedback('upload_complete');
      
      logger.info('✅ CNIB uploadée', { url: publicUrl });
      
      // Appeler NeoFace upload_document
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
      
      const neoFaceDocumentId = uploadData.document_id;
      const neoFaceWebUrl = uploadData.url;
      
      setDocumentId(neoFaceDocumentId);
      setSelfieUrl(neoFaceWebUrl);
      setUploadProgress(60);
      setIsUploadingDocument(false);
      
      logger.info('✅ Document uploadé sur NeoFace', { 
        document_id: neoFaceDocumentId,
        selfie_url: neoFaceWebUrl
      });
      
      // Rediriger vers l'interface web NeoFace pour la capture du selfie
      setVerificationStep({
        current: 2,
        status: 'selfie',
        progress: 60,
        message: 'Redirection vers la capture de selfie...'
      });
      
      await triggerUserFeedback('step_change');
      
      toast.success('📄 Document validé', {
        description: 'Vous allez être redirigé vers la capture de selfie NeoFace',
        duration: 3000
      });
      
      // Ouvrir l'interface NeoFace dans une nouvelle fenêtre
      logger.info('🌐 Ouverture de l\'interface NeoFace...', { url: neoFaceWebUrl });
      const newWindow = window.open(neoFaceWebUrl, '_blank', 'width=800,height=600,scrollbars=yes');
      
      if (!newWindow) {
        toast.error('Popup bloquée', {
          description: 'Veuillez autoriser les popups pour continuer'
        });
        throw new Error('Impossible d\'ouvrir l\'interface NeoFace (popup bloquée)');
      }
      
      setNeoFaceWindow(newWindow);
      
      // Démarrer le polling immédiatement
      setVerificationStep({
        current: 3,
        status: 'verifying',
        progress: 70,
        message: 'En attente de la capture du selfie sur NeoFace...'
      });
      
      await triggerUserFeedback('processing_start');
      
      logger.info('🔄 Démarrage du polling pour', { document_id: neoFaceDocumentId });
      startPolling(neoFaceDocumentId);
      
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

  const handleCloseSelfieWindow = () => {
    // Fermer la fenêtre NeoFace si elle est encore ouverte
    if (neoFaceWindow && !neoFaceWindow.closed) {
      neoFaceWindow.close();
      logger.info('🔒 Fenêtre NeoFace fermée manuellement');
    }
    
    // Passer à l'étape de vérification si on est encore en selfie
    if (verificationStep.status === 'selfie') {
      setVerificationStep({
        current: 3,
        status: 'verifying',
        progress: 80,
        message: 'Vérification de votre selfie en cours...'
      });
    }
    
    toast.info('Fenêtre fermée', {
      description: 'La vérification continue en arrière-plan. Veuillez patienter...',
      duration: 4000
    });
  };

  const reset = () => {
    setCniImage(null);
    setVerificationResult(null);
    
    // Fermer la fenêtre NeoFace si elle est ouverte
    if (neoFaceWindow && !neoFaceWindow.closed) {
      neoFaceWindow.close();
    }
    setNeoFaceWindow(null);
    
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

        {verificationResult && (
          <VerificationResultDisplay result={verificationResult} />
        )}

        {/* Interface pendant l'étape selfie */}
        {verificationStep.status === 'selfie' && (
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Capture de selfie en cours sur NeoFace</strong>
                <br />
                Une nouvelle fenêtre s'est ouverte pour capturer votre selfie de manière sécurisée.
                <br />
                Suivez les instructions affichées pour réaliser votre capture biométrique.
                <br />
                <span className="text-muted-foreground text-xs mt-2 block">
                  Une fois terminé, vous pouvez fermer la fenêtre NeoFace. La vérification continuera automatiquement.
                </span>
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleCloseSelfieWindow}
              variant="outline"
              className="w-full"
              disabled={isPolling}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              J'ai terminé ma capture
            </Button>
          </div>
        )}

        {/* Message pendant la vérification */}
        {verificationStep.status === 'verifying' && (
          <Alert>
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <strong>Vérification en cours...</strong>
              <br />
              Analyse biométrique de votre selfie. Cela peut prendre quelques instants.
              <br />
              <span className="text-xs text-muted-foreground">
                {pollingMessage || 'Traitement en cours...'}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton Vérifier CNIB - visible seulement avant l'étape selfie */}
        {verificationStep.status !== 'selfie' && (
          <VerificationButtons
            canVerify={!!cniImage && uploadProgress === 0}
            isVerifying={isVerifying}
            isPolling={isPolling}
            pollingMessage={pollingMessage}
            hasContent={!!(cniImage || verificationResult)}
            onVerify={handleVerify}
            onReset={reset}
          />
        )}

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
