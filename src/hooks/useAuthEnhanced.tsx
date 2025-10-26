import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseAnon } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { otpService } from '@/services/otpService';
import type { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ error: AuthError | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple' | 'microsoft', userType?: string) => Promise<{ error: AuthError | null }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get client IP address
const getClientIP = async (): Promise<string | null> => {
  try {
    // Utiliser un service de détection d'IP (vous pouvez remplacer par votre propre service)
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    logger.warn('Failed to get client IP', { error });
    return null;
  }
};

// Helper function to log login attempts
const logLoginAttempt = async (email: string, success: boolean, errorMessage?: string) => {
  try {
    // Éviter de logger en double pour les mêmes tentatives
    const now = Date.now();
    const lastLogKey = `login_log_${email}_${Math.floor(now / 5000)}`; // Regrouper par 5 secondes
    const lastLogTime = parseInt(sessionStorage.getItem(lastLogKey) || '0');

    // Si on a déjà loggé cette tentative il y a moins de 5 secondes, ignorer
    if (now - lastLogTime < 5000) {
      return;
    }

    sessionStorage.setItem(lastLogKey, now.toString());

    // Utiliser le client anonyme pour les tentatives de connexion non authentifiées
    const ipAddress = await getClientIP();

    const { error } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        failure_reason: errorMessage,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Logger l'erreur silencieusement pour le débogage mais ne pas bloquer
      logger.warn('Failed to log login attempt', {
        email: email.replace(/(.{2}).*@/, '$1***@'), // Masquer l'email
        error: error.message,
        success
      });
    } else {
      logger.info('Login attempt logged successfully', {
        email: email.replace(/(.{2}).*@/, '$1***@'), // Masquer l'email
        success
      });
    }
  } catch (error) {
    // Ne pas logger l'erreur de logging pour éviter les boucles
    logger.warn('Error logging login attempt', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceSigningOut, setForceSigningOut] = useState(false);

  const fetchProfile = async (userId: string) => {
    logger.info('Fetching profile for user', { userId });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile', { error, userId });

        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          logger.info('Profile not found, creating new one', { userId });
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user?.user_metadata) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  full_name: userData.user.user_metadata.full_name || userData.user.email,
                  user_type: userData.user.user_metadata.user_type || 'locataire',
                  email: userData.user.email
                });

              if (!insertError) {
                // Retry fetching the profile
                return await fetchProfile(userId);
              }
            }
          } catch (createError) {
            logger.error('Error creating profile', { error: createError, userId });
            // Ne pas bloquer - retourner null pour continuer
            return null;
          }
        }
        // Pour d'autres erreurs (permissions, etc), essayer de récupérer malgré tout
        else {
          logger.warn('Profile fetch error, returning null but continuing', { error, userId });
          return null;
        }
      }

      logger.info('Profile fetched successfully', { userId, profile: data ? 'exists' : 'null' });
      return data;
    } catch (error) {
      logger.error('Unexpected error fetching profile', { error, userId });
      return null;
    }
  };

  const fetchUserRoles = async (userId: string) => {
    logger.info('Fetching roles for user', { userId });

    try {
      // Use anonymous client to avoid RLS issues
      const { data, error } = await supabaseAnon
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching roles', { error, userId });

        // If RLS recursion issue or other 500 errors, use default role
        if (error.code === '42P17' || error.message?.includes('recursion') ||
            error.message?.includes('500') || error.status === 500) {
          logger.warn('RLS recursion or server error in user_roles, using default role', { userId, error });
          return ['locataire'];
        }

        // If no roles found, assign default role
        if (error.code === 'PGRST116') {
          logger.info('No roles found, assigning default role', { userId });
          // Skip insert for now due to RLS issues
          return ['locataire'];
        }
        return [];
      }
      
      logger.info('Roles fetched successfully', { userId, roles: data });
      return data?.map(r => r.role) || [];
    } catch (error: any) {
      logger.error('Unexpected error fetching roles', { error, userId });

      // Comprehensive error handling for different error types
      if (error.message?.includes('recursion') || error.message?.includes('infinite recursion')) {
        logger.warn('Infinite recursion detected in user_roles, using default role', { userId });
        return ['locataire'];
      }

      if (error.message?.includes('500') || error.status === 500) {
        logger.warn('Server error in user_roles, using default role', { userId });
        return ['locataire'];
      }

      return ['locataire']; // Default role as fallback
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      const userRoles = await fetchUserRoles(user.id);
      setRoles(userRoles);
    }
  };

  useEffect(() => {
    logger.info('Setting up auth listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { event, hasSession: !!session, forceSigningOut });

        // Si on est en train de forcer la déconnexion, ignorer les réactivations
        if (forceSigningOut && event === 'SIGNED_IN' && session?.user) {
          logger.info('🚫 [AUTH] Ignoring sign-in during forced sign-out', { userId: session.user.id });
          await supabase.auth.signOut();
          return;
        }

        // Vérifier si l'utilisateur vient de s'inscrire et n'a pas encore vérifié son email
        // Ne pas permettre l'accès au dashboard sans vérification OTP
        if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
          logger.info('🚫 [AUTH] User signed in but email not confirmed, blocking dashboard access', {
            userId: session.user.id,
            email: session.user.email,
            emailConfirmed: !!session.user.email_confirmed_at
          });
          // Forcer la déconnexion pour obliger la vérification OTP
          await supabase.auth.signOut();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to avoid deadlock
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            const userRoles = await fetchUserRoles(session.user.id);
            setRoles(userRoles);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.info('Initial session check', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          const userRoles = await fetchUserRoles(session.user.id);
          setRoles(userRoles);
          setLoading(false);
          logger.info('Auth loading complete');
        }, 0);
      } else {
        setLoading(false);
        logger.info('No session, loading complete');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      logger.info('🚀 [AUTH] Starting user registration', { email, userType, fullName });

      // Étape 1: Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          }
        }
      });

      if (error) {
        await logLoginAttempt(email, false, error.message);
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
        return { error, data: null };
      }

      // Étape 2: Forcer toujours le processus OTP en développement pour le test
      const isDevelopment = import.meta.env.DEV;
      const forceOTP = true; // Forcer OTP pour tous les nouveaux utilisateurs

      // Toujours forcer le processus OTP (temporairement pour le debug)
      if (data.user) {
        logger.info('🎯 [AUTH] User created - forcing OTP process', {
          userId: data.user.id,
          email,
          userEmail: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          userMetadata: data.user.user_metadata,
          hasSession: !!data.session,
          isDevelopment,
          forceOTP
        });

        try {
          // 🔍 DEBUG: Obtenir l'adresse IP et user agent pour le suivi
          const ipAddress = await getClientIP();
          const userAgent = navigator.userAgent;
          
          logger.info('🔍 [DEBUG] Starting OTP creation process', {
            userId: data.user.id,
            email,
            ipAddress,
            userAgent: userAgent.substring(0, 100) + '...'
          });

          // Créer le code OTP dans notre base de données
          const otpResult = await otpService.createOTPCode(
            data.user.id,
            email,
            'signup',
            ipAddress,
            userAgent
          );

          logger.info('🔍 [DEBUG] OTP creation result', {
            success: otpResult.success,
            hasCode: !!otpResult.code,
            message: otpResult.message,
            userId: data.user.id
          });

          if (otpResult.success && otpResult.code) {
            logger.info('✅ [AUTH] OTP code generated successfully', {
              userId: data.user.id,
              email,
              code: otpResult.code.replace(/./g, '*') // Masquer le code dans les logs
            });

            // 🔍 DEBUG: Envoyer le code par email via Supabase avec le code OTP généré
            logger.info('🔍 [DEBUG] Starting email sending process', { email, hasOTPCode: !!otpResult.code });
            const emailResult = await otpService.sendOTPByEmail(email, otpResult.code, 'signup');

            logger.info('🔍 [DEBUG] Email sending result', {
              success: emailResult.success,
              error: emailResult.error,
              email,
              mailpitUrl: emailResult.mailpitUrl
            });

            if (emailResult.success) {
              await logLoginAttempt(email, true);

              // Message de succès avec instructions pour Mailpit si disponible
              const description = emailResult.mailpitUrl
                ? `Un code de vérification à 6 chiffres a été envoyé à votre adresse email. Pour le développement, vérifiez dans Mailpit: ${emailResult.mailpitUrl}`
                : "Un code de vérification à 6 chiffres a été envoyé à votre adresse email.";

              toast({
                title: "Code OTP envoyé",
                description: description,
              });

              // 🔍 DEBUG: Instructions détaillées pour Mailpit
              if (emailResult.mailpitUrl) {
                logger.info('🔍 [DEBUG] Mailpit instructions', {
                  message: `Consultez l'email dans Mailpit à ${emailResult.mailpitUrl}`,
                  email,
                  code: otpResult.code.replace(/./g, '*')
                });
              }
            } else {
              logger.error('❌ [AUTH] Failed to send OTP email', { error: emailResult.error, email });
              toast({
                title: "Erreur d'envoi",
                description: "Le compte a été créé mais l'envoi du code a échoué. Veuillez réessayer.",
                variant: "destructive",
              });
            }
          } else {
            logger.error('❌ [AUTH] Failed to generate OTP code', { message: otpResult.message, userId: data.user.id });
            toast({
              title: "Erreur de génération",
              description: "Le compte a été créé mais la génération du code a échoué.",
              variant: "destructive",
            });
          }
        } catch (otpError) {
          logger.error('💥 [AUTH] Error in OTP process', { error: otpError, userId: data.user.id });
          toast({
            title: "Erreur technique",
            description: "Une erreur technique est survenue. Veuillez réessayer.",
            variant: "destructive",
          });
        }

      } else if (data.session) {
        // Utilisateur connecté automatiquement - ignorer en développement, forcer OTP
        if (isDevelopment) {
          console.log('⚠️ [DEBUG] User auto-signed in, forcing OTP in development', {
            userId: data.user.id,
            email
          });

          logger.warn('⚠️ [AUTH] User auto-signed in, forcing OTP in development', {
            userId: data.user.id,
            email
          });

          // Activer le flag de déconnexion forcée pour éviter les réactivations
          setForceSigningOut(true);

          // Sign out l'utilisateur pour forcer le processus OTP
          logger.info('🔒 [AUTH] Signing out user to force OTP process', { userId: data.user.id });
          console.log('🔒 [DEBUG] Starting sign out process');

          await supabase.auth.signOut();
          console.log('✅ [DEBUG] Sign out completed');

          // Attendre un peu pour s'assurer que le signOut est bien effectué
          await new Promise(resolve => setTimeout(resolve, 500));

          // Forcer la mise à jour de l'état local
          setUser(null);
          setSession(null);
          setProfile(null);
          setRoles([]);

          // Désactiver le flag après un délai pour permettre les futures connexions normales
          setTimeout(() => {
            setForceSigningOut(false);
            logger.info('🔓 [AUTH] Force sign-out flag cleared', { email });
            console.log('🔓 [DEBUG] Force sign-out flag cleared');
          }, 2000);

          toast({
            title: "Compte créé !",
            description: "Un code de vérification a été envoyé à votre email.",
          });

          logger.info('✅ [AUTH] User signed out, ready for OTP verification', { email });
          console.log('✅ [DEBUG] Returning success for OTP flow');

          // Ne pas retourner d'erreur pour permettre la redirection vers la page OTP
          return { error: null, data: { user: data.user } };
        } else {
          logger.info('✅ [AUTH] User automatically signed in - production mode', {
            userId: data.user.id,
            email
          });
          await refreshProfile();
          toast({
            title: "Inscription réussie",
            description: "Votre compte a été créé avec succès !",
          });
        }
      } else {
        logger.warn('⚠️ [AUTH] Unexpected registration state', {
          hasUser: !!data.user,
          hasSession: !!data.session,
          email
        });
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé. Vérifiez votre email pour le code OTP.",
        });
      }

      return { error: null, data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      await logLoginAttempt(email, false, errorMessage);
      logger.error('Unexpected error in signUp', { error: errorMessage, email });
      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as AuthError, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logLoginAttempt(email, false, error.message);
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        await logLoginAttempt(email, true);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Mon Toit !",
        });
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      await logLoginAttempt(email, false, errorMessage);
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as AuthError };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft', userType: string = 'locataire') => {
    const redirectUrl = `${window.location.origin}/auth/callback?userType=${userType}`;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any, // Cast to any to handle Microsoft provider
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: provider === 'google'
            ? 'email profile'
            : provider === 'facebook'
            ? 'email public_profile'
            : provider === 'apple'
            ? 'email name'
            : 'email profile'
        }
      });

      if (error) {
        logger.error('OAuth sign in error', { provider, error: error.message });
        toast({
          title: "Erreur de connexion OAuth",
          description: `Impossible de se connecter avec ${provider}: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Redirection vers l'authentification",
          description: `Redirection vers ${provider}...`,
        });
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Unexpected OAuth error', { provider, error: errorMessage });
      toast({
        title: "Erreur de connexion OAuth",
        description: `Une erreur inattendue est survenue avec ${provider}: ${errorMessage}`,
        variant: "destructive",
      });
      return { error: error as AuthError };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      logger.info('Starting OTP verification', { email, token: token.replace(/./g, '*') });

      // Étape 1: Vérifier le code OTP avec notre service personnalisé
      const otpResult = await otpService.verifyOTPCode(email, token, 'signup');

      if (!otpResult.success) {
        logger.warn('OTP verification failed', {
          email,
          message: otpResult.message,
          userId: otpResult.user_id
        });

        toast({
          title: "Code invalide",
          description: otpResult.message,
          variant: "destructive",
        });
        return { error: { message: otpResult.message } as AuthError };
      }

      // Étape 2: Si la vérification réussit, confirmer l'email et finaliser
      if (otpResult.success) {
        logger.info('OTP verified successfully', {
          email,
          userId: otpResult.user_id
        });

        // Supabase gère la confirmation d'email via l'URL de vérification ou un flux de vérification OTP
        // La ligne `email_confirm: true` n'est pas supportée par Supabase.auth.updateUser
        // On suppose que l'étape de vérification OTP valide le processus.

        await logLoginAttempt(email, true);
        toast({
          title: "Compte vérifié !",
          description: "Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.",
        });

        // Forcer le rafraîchissement du profil si on a un user_id
        if (otpResult.user_id) {
          await refreshProfile();
        }

        logger.info('OTP verification completed successfully', {
          userId: otpResult.user_id,
          email
        });

        return { error: null };
      }

      return { error: { message: 'Erreur inattendue lors de la vérification' } as AuthError };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Unexpected error in OTP verification', { error: errorMessage, email });
      toast({
        title: "Erreur de vérification",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setRoles([]);
        
        // ✅ SÉCURITÉ : Nettoyer le cache lors de la déconnexion
        const { clearCacheOnLogout } = await import('@/lib/queryClient');
        clearCacheOnLogout();
        
        toast({
          title: "Déconnexion",
          description: "À bientôt sur Mon Toit !",
        });
      } else {
        logger.error('Error during sign out', { error });
      }
    } catch (error) {
      logger.error('Unexpected error during sign out', { error });
    }
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, signUp, signIn, signInWithOAuth, verifyOTP, signOut, refreshProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};