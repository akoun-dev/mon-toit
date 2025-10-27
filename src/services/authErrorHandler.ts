/**
 * Gestionnaire d'erreurs centralisé pour l'authentification
 * Gère les erreurs 401/400 et autres problèmes d'authentification
 */

import { AuthError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';

export interface AuthErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

export class AuthErrorHandler {
  /**
   * Gère les erreurs d'authentification de manière centralisée
   */
  static handle(error: AuthError | any, options: AuthErrorHandlerOptions = {}) {
    const { showToast = true, logError = true, context = 'Auth' } = options;

    if (logError) {
      logger.error(`[${context}] Authentication error:`, {
        message: error?.message || 'Unknown error',
        status: error?.status,
        code: error?.code,
        context
      });
    }

    // Ne pas montrer de toast pour les erreurs réseau
    if (!navigator.onLine) {
      if (showToast) {
        toast({
          title: "Connexion perdue",
          description: "Veuillez vérifier votre connexion internet et réessayer.",
          variant: "destructive",
        });
      }
      return;
    }

    // Gérer les différents types d'erreurs
    if (error?.message) {
      this.handleSpecificErrors(error, showToast, context);
    } else {
      this.handleUnknownError(error, showToast);
    }
  }

  /**
   * Gère les erreurs spécifiques d'authentification
   */
  private static handleSpecificErrors(error: AuthError, showToast: boolean, context: string) {
    const { message, status } = error;

    // Erreurs 401 - Non autorisé
    if (status === 401) {
      if (message.includes('Invalid login credentials')) {
        if (showToast) {
          toast({
            title: "Identifiants incorrects",
            description: "L'email ou le mot de passe est incorrect. Veuillez réessayer.",
            variant: "destructive",
          });
        }
      } else if (message.includes('JWT') || message.includes('token')) {
        if (showToast) {
          toast({
            title: "Session expirée",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive",
          });
        }
      } else {
        if (showToast) {
          toast({
            title: "Accès non autorisé",
            description: "Vous n'êtes pas autorisé à effectuer cette action.",
            variant: "destructive",
          });
        }
      }
    }
    // Erreurs 400 - Bad Request
    else if (status === 400) {
      if (message.includes('Invalid login credentials')) {
        if (showToast) {
          toast({
            title: "Identifiants invalides",
            description: "L'email ou le mot de passe n'est pas valide. Veuillez vérifier vos informations.",
            variant: "destructive",
          });
        }
      } else if (message.includes('Email not confirmed')) {
        if (showToast) {
          toast({
            title: "Email non confirmé",
            description: "Veuillez confirmer votre email avant de vous connecter.",
            variant: "destructive",
          });
        }
      } else {
        if (showToast) {
          toast({
            title: "Requête invalide",
            description: "La requête est invalide. Veuillez réessayer.",
            variant: "destructive",
          });
        }
      }
    }
    // Erreurs 422 - Entity already exists
    else if (status === 422) {
      if (message.includes('User already registered')) {
        if (showToast) {
          toast({
            title: "Compte déjà existant",
            description: "Cet email est déjà associé à un compte. Veuillez vous connecter ou utiliser un autre email.",
            variant: "destructive",
          });
        }
      }
    }
    // Erreurs 429 - Too Many Requests
    else if (status === 429) {
      if (showToast) {
        toast({
          title: "Trop de tentatives",
          description: "Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.",
          variant: "destructive",
        });
      }
    }
    // Erreurs 500 - Server Error
    else if (status >= 500) {
      if (showToast) {
        toast({
          title: "Erreur serveur",
          description: "Une erreur serveur est survenue. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      }
    }
    // Erreurs réseau
    else if (message.includes('NetworkError') || message.includes('fetch')) {
      if (showToast) {
        toast({
          title: "Erreur réseau",
          description: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion.",
          variant: "destructive",
        });
      }
    }
    // Erreurs de fonction RPC
    else if (message.includes('function') && message.includes('not found')) {
      if (showToast) {
        toast({
          title: "Service indisponible",
          description: "Un service nécessaire est temporairement indisponible. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      }
    }
    // Erreur générique
    else {
      if (showToast) {
        toast({
          title: "Erreur d'authentification",
          description: "Une erreur est survenue lors de l'authentification. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }
  }

  /**
   * Gère les erreurs inconnues
   */
  private static handleUnknownError(error: any, showToast: boolean) {
    logger.error('Unknown authentication error:', error);

    if (showToast) {
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }

  /**
   * Vérifie si une erreur est liée à l'authentification
   */
  static isAuthError(error: any): error is AuthError {
    return error && (
      error.status === 401 ||
      error.status === 400 ||
      error.status === 422 ||
      error.status === 429 ||
      error?.message?.includes('Invalid login credentials') ||
      error?.message?.includes('JWT') ||
      error?.message?.includes('token') ||
      error?.message?.includes('Auth')
    );
  }

  /**
   * Gère les erreurs de manière silencieuse (pas de toast)
   */
  static handleSilent(error: AuthError | any, context: string = 'Auth') {
    this.handle(error, { showToast: false, logError: true, context });
  }

  /**
   * Gère les erreurs de manière verbose (toast + logs détaillés)
   */
  static handleVerbose(error: AuthError | any, context: string = 'Auth') {
    logger.error(`[${context}] Detailed authentication error:`, {
      error: JSON.stringify(error, null, 2),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.handle(error, { showToast: true, logError: false, context });
  }
}

export default AuthErrorHandler;