import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

export interface UseCameraReturn {
  isCapturing: boolean;
  isVideoLoading: boolean;
  capturedImage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => void;
  reset: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Nettoyage automatique lors du démontage
  useEffect(() => {
    return () => {
      logger.debug('Nettoyage useCamera');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.debug('Track arrêté', { label: track.label });
        });
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      logger.info('🎥 Démarrage de la caméra');
      setIsVideoLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('L\'API MediaDevices n\'est pas supportée par ce navigateur');
      }

      logger.debug('📡 Demande d\'accès à la caméra...');
      // Contraintes simplifiées pour meilleure compatibilité
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user'
          // Pas de contraintes width/height - laisse le navigateur décider
        },
        audio: false
      });
      
      logger.info('✅ Stream vidéo obtenu', { 
        tracks: stream.getVideoTracks().length,
        settings: stream.getVideoTracks()[0].getSettings() 
      });
      
      if (!videoRef.current) {
        logger.error('❌ Référence vidéo non disponible - élément video non monté');
        throw new Error('Référence vidéo non disponible');
      }
      
      logger.debug('✅ Élément video trouvé', {
        nodeName: videoRef.current.nodeName,
        readyState: videoRef.current.readyState
      });

      const video = videoRef.current;
      streamRef.current = stream;
      
      const playPromise = new Promise<void>((resolve, reject) => {
        let resolved = false;
        
        const checkVideoDimensions = () => {
          if (resolved) return;
          
          logger.debug('🔍 Vérification dimensions', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolved = true;
            cleanup();
            setIsCapturing(true);
            setIsVideoLoading(false);
            logger.info('✅ Caméra prête à capturer');
            toast.success('Caméra activée !', { 
              description: 'Positionnez votre visage au centre' 
            });
            resolve();
          }
        };
        
        const onLoadedMetadata = () => {
          logger.debug('🎬 loadedmetadata déclenché', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          checkVideoDimensions();
        };

        const onCanPlay = () => {
          logger.debug('▶️ canplay déclenché', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          checkVideoDimensions();
        };

        const onError = (e: Event) => {
          logger.error('❌ Erreur vidéo', { error: e });
          cleanup();
          reject(new Error('Erreur de chargement de la vidéo'));
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);
        
        // Timeout augmenté à 10 secondes
        setTimeout(() => {
          if (resolved) return;
          
          cleanup();
          
          if (video.readyState >= 2 && video.videoWidth > 0) {
            logger.debug('⏱️ Timeout mais vidéo prête', {
              readyState: video.readyState,
              width: video.videoWidth,
              height: video.videoHeight
            });
            resolved = true;
            setIsCapturing(true);
            setIsVideoLoading(false);
            toast.success('Caméra activée !');
            resolve();
          } else {
            logger.error('⏱️ Timeout: vidéo non prête après 10s', {
              readyState: video.readyState,
              width: video.videoWidth,
              height: video.videoHeight,
              clientWidth: video.clientWidth,
              clientHeight: video.clientHeight
            });
            reject(new Error('La vidéo n\'a pas pu se charger'));
          }
        }, 10000);
      });

      video.srcObject = stream;
      video.load(); // Force le rechargement des métadonnées
      
      // Attendre un peu pour que le navigateur charge les métadonnées
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        await video.play();
        logger.debug('✅ video.play() réussi');
      } catch (playError) {
        logger.warn('⚠️ video.play() échoué, on continue quand même', { error: playError });
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
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          logger.debug('Track arrêté (erreur)', { label: track.label });
        });
        streamRef.current = null;
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    logger.debug('Arrêt de la caméra');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setIsVideoLoading(false);
  }, []);

  const capture = useCallback(() => {
    logger.debug('Tentative de capture du selfie');
    
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Erreur de capture', { description: 'Références vidéo manquantes' });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!streamRef.current || streamRef.current.getTracks().length === 0) {
      logger.error('Aucun stream actif');
      toast.error('Caméra inactive', { 
        description: 'Relancez la caméra et réessayez' 
      });
      return;
    }

    // Fallback : utiliser dimensions CSS si videoWidth/Height sont à 0
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width === 0 || height === 0) {
      width = video.clientWidth || 640;
      height = video.clientHeight || 480;
      logger.warn('⚠️ Utilisation des dimensions CSS comme fallback', { 
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        clientWidth: width,
        clientHeight: height 
      });
    }

    logger.debug('📸 Capture du selfie', { width, height });

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      logger.info('Selfie capturé avec succès');
      toast.success('Selfie capturé !');
    } else {
      logger.error('Impossible d\'obtenir le contexte canvas');
      toast.error('Erreur de capture', { description: 'Impossible de traiter l\'image' });
    }
  }, [stopCamera]);

  const reset = useCallback(() => {
    setCapturedImage(null);
    stopCamera();
  }, [stopCamera]);

  return {
    isCapturing,
    isVideoLoading,
    capturedImage,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capture,
    reset
  };
};
