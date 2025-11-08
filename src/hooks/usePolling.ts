import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@/services/logger';

export interface PollingOptions<T = any> {
  interval?: number;
  maxAttempts?: number;
  onSuccess?: (data: T) => void;
  onError?: (data: T) => void;
  onTimeout?: () => void;
}

export interface UsePollingReturn {
  isPolling: boolean;
  attempts: number;
  message: string;
  startPolling: (documentId: string) => void;
  stopPolling: () => void;
}

export const usePolling = <T extends { status: string }>(
  pollFn: (documentId: string) => Promise<T>,
  options: PollingOptions<T> = {}
): UsePollingReturn => {
  const {
    interval = 1500,
    maxAttempts = 40,
    onSuccess,
    onError,
    onTimeout
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const documentIdRef = useRef<string | null>(null);

  // Nettoyage automatique lors du démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((documentId: string) => {
    documentIdRef.current = documentId;
    setIsPolling(true);
    setAttempts(0);
    setMessage('En attente de votre selfie...');
    logger.info('🔄 Début du polling...');
    
    let currentAttempt = 0;
    
    intervalRef.current = setInterval(async () => {
      currentAttempt++;
      setAttempts(currentAttempt);
      
      const minutes = Math.floor(currentAttempt * (interval / 1000) / 60);
      const seconds = (currentAttempt * (interval / 1000) % 60).toString().padStart(2, '0');
      setMessage(`En attente de votre selfie... (${minutes}:${seconds})`);
      
      try {
        const result = await pollFn(documentIdRef.current!);
        
        logger.debug('Polling status', { status: result.status, attempt: currentAttempt });
        
        if (result.status === 'verified' || result.status === 'success') {
          stopPolling();
          onSuccess?.(result);
        } else if (result.status === 'failed' || result.status === 'error') {
          stopPolling();
          onError?.(result);
        }
        // Si 'waiting', continue le polling
        
      } catch (error) {
        logger.error('Erreur durant le polling', { error });
        // Continue polling malgré l'erreur
      }
      
      // Timeout après maxAttempts
      if (currentAttempt >= maxAttempts) {
        stopPolling();
        onTimeout?.();
      }
      
    }, interval);
  }, [pollFn, interval, maxAttempts, onSuccess, onError, onTimeout, stopPolling]);

  return {
    isPolling,
    attempts,
    message,
    startPolling,
    stopPolling
  };
};
