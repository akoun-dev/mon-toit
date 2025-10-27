/**
 * Hook pour gérer les erreurs d'authentification dans les composants
 */

import { useCallback } from 'react';
import { AuthErrorHandler } from '@/services/authErrorHandler';
import { AuthError } from '@supabase/supabase-js';

export interface UseAuthErrorHandlerReturn {
  handleAuthError: (error: AuthError | any, context?: string) => void;
  handleSilentAuthError: (error: AuthError | any, context?: string) => void;
  handleVerboseAuthError: (error: AuthError | any, context?: string) => void;
  isAuthError: (error: any) => boolean;
}

export const useAuthErrorHandler = (): UseAuthErrorHandlerReturn => {
  const handleAuthError = useCallback((error: AuthError | any, context: string = 'Auth') => {
    AuthErrorHandler.handle(error, { context });
  }, []);

  const handleSilentAuthError = useCallback((error: AuthError | any, context: string = 'Auth') => {
    AuthErrorHandler.handleSilent(error, context);
  }, []);

  const handleVerboseAuthError = useCallback((error: AuthError | any, context: string = 'Auth') => {
    AuthErrorHandler.handleVerbose(error, context);
  }, []);

  const isAuthError = useCallback((error: any): error is AuthError => {
    return AuthErrorHandler.isAuthError(error);
  }, []);

  return {
    handleAuthError,
    handleSilentAuthError,
    handleVerboseAuthError,
    isAuthError
  };
};

export default useAuthErrorHandler;