import { useState, useCallback } from 'react';
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

interface CNIBFormProps {
  onSubmit?: () => void;
}

const CNIBForm = ({ onSubmit }: CNIBFormProps = {}) => {
  const { user } = useAuth();
  const [captureMethod] = useState<'popup'>('popup');
  const [cniImage, setCniImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Nouveaux states pour NeoFace
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    similarityScore: string;
    message: string;
    canRetry: boolean;
    resultText?: string;
  } | null>(null);
  
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
      onSuccess: (data) => {
        setUploadProgress(100);
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
      onError: (data) => {
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
      
      if (storageError) {
        logger.error('Erreur upload Storage:', { message: storageError.message });
        throw storageError;
      }
      
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
      
      logger.info('✅ Document uploadé sur NeoFace', { 
        document_id: uploadData.document_id,
        selfie_url: uploadData.url.substring(0, 50) + '...'
      });
      
      // ========================================
      // ÉTAPE 3 : Ouvrir fenêtre selfie NeoFace
      // ========================================
      logger.info('🪟 Ouverture fenêtre NeoFace...');
      
      const selfieWindow = window.open(
        uploadData.selfie_url, 
        'neoface-selfie',
        'width=600,height=800,resizable=yes,scrollbars=yes'
      );
      
      if (!selfieWindow) {
        toast.error('Popup bloquée', {
          description: 'Veuillez autoriser les popups pour ce site et réessayer'
        });
        throw new Error('Popup bloquée par le navigateur');
      }
      
      toast.success('📸 Fenêtre NeoFace ouverte', {
        description: 'Prenez votre selfie dans la nouvelle fenêtre. La vérification démarrera automatiquement.',
        duration: 5000
      });
      
      setUploadProgress(70);
      
      // ========================================
      // ÉTAPE 4 : Attendre 3 secondes puis démarrer le polling
      // ========================================
      logger.info('⏳ Attente de 3 secondes avant polling...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logger.info('🔄 Démarrage du polling...');
      startPolling(uploadData.document_id);
      
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
    setVerificationResult(null);
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

        {/* Info sur la méthode NeoFace */}
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

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le selfie sera capturé via l'interface NeoFace sécurisée après validation. Celle-ci inclut la détection automatique de visage, la vérification de qualité et les clignements d'yeux.
            </AlertDescription>
          </Alert>
        </div>

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
