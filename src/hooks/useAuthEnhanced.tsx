import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ error: AuthError | null }>;
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
    // Direct table insert instead of RPC call to avoid type issues
    const { error } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        user_id: null, // Can be populated if we have the user ID
        ip_address: null, // You can get this from a service if needed
        fingerprint: null, // You can get this from device fingerprinting
        user_agent: navigator.userAgent
      });
    
    if (error) {
      logger.warn('Failed to log login attempt', { error, email, success });
    }
  } catch (error) {
    logger.warn('Error logging login attempt', { error, email, success });
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          logger.info('Profile not found, creating new one', { userId });
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.user_metadata) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: userData.user.user_metadata.full_name || userData.user.email,
                user_type: userData.user.user_metadata.user_type || 'locataire'
              });
            
            if (!insertError) {
              // Retry fetching the profile
              return await fetchProfile(userId);
            }
          }
        }
        return null;
      }
      
      logger.info('Profile fetched successfully', { userId });
      return data;
    } catch (error) {
      logger.error('Unexpected error fetching profile', { error, userId });
      return null;
    }
  };

  const fetchUserRoles = async (userId: string) => {
    logger.info('Fetching roles for user', { userId });
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching roles', { error, userId });
        
        // If no roles found, assign default role
        if (error.code === 'PGRST116') {
          logger.info('No roles found, assigning default role', { userId });
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'locataire'
            });
          
          if (!insertError) {
            return ['locataire'];
          }
        }
        return [];
      }
      
      logger.info('Roles fetched successfully', { userId, roles: data });
      return data?.map(r => r.role) || [];
    } catch (error) {
      logger.error('Unexpected error fetching roles', { error, userId });
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
        logger.info('Auth state changed', { event, hasSession: !!session });
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
          logger.warn('⚠️ [AUTH] User auto-signed in, forcing OTP in development', {
            userId: data.user.id,
            email
          });

          // Sign out l'utilisateur pour forcer le processus OTP
          await supabase.auth.signOut();

          toast({
            title: "Redirection pour vérification",
            description: "Veuillez vous inscrire à nouveau pour recevoir le code de vérification.",
          });

          return { error: { message: "Veuillez vous inscrire à nouveau" }, data: null };
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
        provider,
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

      // Étape 2: Si la vérification réussit, confirmer l'email dans Supabase
      if (otpResult.user_id) {
        logger.info('OTP verified, confirming email in Supabase', {
          userId: otpResult.user_id,
          email
        });

        // Marquer l'email comme confirmé dans Supabase
        const { error: confirmError } = await supabase.auth.updateUser({
          email_confirm: true
        });

        if (confirmError) {
          logger.error('Error confirming email in Supabase', {
            error: confirmError,
            userId: otpResult.user_id
          });

          toast({
            title: "Erreur de confirmation",
            description: "Le code est valide mais la confirmation du compte a échoué. Veuillez contacter le support.",
            variant: "destructive",
          });
          return { error: confirmError };
        }

        // Étape 3: Connecter l'utilisateur automatiquement
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: '', // Nous n'avons pas le mot de passe ici
        });

        // Si nous ne pouvons pas connecter automatiquement, c'est normal
        // L'utilisateur devra se connecter manuellement

        await logLoginAttempt(email, true);
        toast({
          title: "Compte vérifié !",
          description: "Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.",
        });

        // Forcer le rafraîchissement du profil
        await refreshProfile();

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
