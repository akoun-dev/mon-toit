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
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ error: AuthError | null; data?: { user: User } }>;
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
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    logger.error('Error getting client IP:', error);
    return null;
  }
};

export const useAuthEnhanced = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthEnhanced must be used within an AuthProvider');
  }
  return context;
};

// Alias pour maintenir la compatibilité avec le code existant
export const useAuth = useAuthEnhanced;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceSigningOut, setForceSigningOut] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
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
            logger.error('Error creating profile', { createError, userId });
          }
        }
        return null;
      }

      logger.info('Profile fetched successfully', { userId, userType: data.user_type });
      return data;
    } catch (error) {
      logger.error('Error in fetchProfile', { error, userId });
      return null;
    }
  };

  // Function to fetch user roles
  const fetchUserRoles = async (userId: string): Promise<string[]> => {
    logger.info('Fetching user roles', { userId });

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching user roles', { error, userId });
        // If user_roles table doesn't exist, return default role
        if (error.code === 'PGRST116') {
          logger.warn('user_roles table not found, using default role', { userId });
          return ['locataire']; // Default role
        }
        return [];
      }

      const roles = data.map(item => item.role);
      logger.info('User roles fetched successfully', { userId, roles });
      return roles;
    } catch (error) {
      logger.error('Error in fetchUserRoles', { error, userId });
      return [];
    }
  };

  // Function to log login attempts
  const logLoginAttempt = async (email: string, success: boolean) => {
    try {
      const clientIP = await getClientIP();
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('login_attempts')
        .insert({
          email,
          success,
          ip_address: clientIP,
          user_agent: userAgent
        });

      if (error) {
        logger.error('Error logging login attempt', { error, email, success });
      }
    } catch (error) {
      logger.error('Exception in logLoginAttempt', { error, email, success });
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

        // BLOQUER TOUJOURS l'accès au dashboard si l'email n'est pas confirmé
        // Ceci empêche les utilisateurs non vérifiés d'accéder à l'application
        if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
          logger.info('🚫 [AUTH] User signed in but email not confirmed, blocking dashboard access', {
            userId: session.user.id,
            email: session.user.email,
            emailConfirmed: !!session.user.email_confirmed_at,
            event
          });

          // Forcer la déconnexion immédiatement
          try {
            await supabase.auth.signOut();

            // Réinitialiser manuellement l'état pour s'assurer qu'il n'y a pas de session résiduelle
            setUser(null);
            setSession(null);
            setProfile(null);
            setRoles([]);

            // Afficher un message pour l'utilisateur
            toast({
              title: "Vérification requise",
              description: "Veuillez vérifier votre email et entrer le code OTP pour activer votre compte.",
              variant: "destructive",
            });

            return;
          } catch (signOutError) {
            logger.error('Error forcing sign out for unconfirmed user', { signOutError });
          }
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Ne charger le profil que si l'email est confirmé
          if (session.user.email_confirmed_at) {
            // Defer profile fetching to avoid deadlock
            setTimeout(async () => {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
              const userRoles = await fetchUserRoles(session.user.id);
              setRoles(userRoles);
            }, 0);
          } else {
            logger.warn('⚠️ [AUTH] Not loading profile for unconfirmed user', {
              userId: session.user.id,
              email: session.user.email
            });
          }
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.info('Initial session check', { hasSession: !!session });

      // Si la session existe mais l'email n'est pas confirmé, déconnecter immédiatement
      if (session?.user && !session.user.email_confirmed_at) {
        logger.info('🚫 [AUTH] Initial session has unconfirmed email, signing out', {
          userId: session.user.id,
          email: session.user.email
        });

        supabase.auth.signOut().then(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRoles([]);
        });

        toast({
          title: "Email non confirmé",
          description: "Veuillez confirmer votre email et utiliser le code OTP pour vous connecter.",
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Vérifier si l'utilisateur a complété la vérification OTP (version simplifiée)
        try {
          // Utiliser le service simplifié pour vérifier
          const isVerified = otpService.isEmailVerified(session.user.email!, 'signup');

          if (!isVerified) {
            logger.warn('🚫 [AUTH] User attempting login without OTP verification', {
              userId: session.user.id,
              email: session.user.email
            });

            // Déconnecter immédiatement l'utilisateur
            supabase.auth.signOut().then(() => {
              setUser(null);
              setSession(null);
              setProfile(null);
              setRoles([]);
            });

            toast({
              title: "Vérification OTP requise",
              description: "Veuillez d'abord vérifier votre email avec le code OTP envoyé.",
              variant: "destructive",
            });

            setLoading(false);
            return;
          }
        } catch (otpError) {
          logger.error('Error checking OTP verification', { otpError });
        }

        fetchProfile(session.user.id).then(profileData => {
          setProfile(profileData);
        });

        fetchUserRoles(session.user.id).then(userRoles => {
          setRoles(userRoles);
        });
      } else {
        setProfile(null);
        setRoles([]);
      }

      setLoading(false);
    });

    return () => {
      logger.info('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [forceSigningOut]);

  const signIn = async (email: string, password: string) => {
    try {
      logger.info('Starting sign in process', { email });

      // Vérifier d'abord si l'email a été vérifié avec OTP
      const isVerified = otpService.isEmailVerified(email, 'signup');
      if (!isVerified) {
        toast({
          title: "Vérification requise",
          description: "Veuillez d'abord vérifier votre email avec le code OTP avant de vous connecter.",
          variant: "destructive",
        });
        return { error: { message: 'Email non vérifié. Veuillez utiliser le code OTP envoyé.' } as AuthError };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logLoginAttempt(email, false);
        logger.error('Sign in error', { error: error.message, email });
        return { error };
      }

      if (data.user) {
        await logLoginAttempt(email, true);
        logger.info('Sign in successful', { userId: data.user.id, email });

        // Nettoyer les anciens codes OTP
        otpService.cleanupExpiredOTPs();
      }

      return { error: null };
    } catch (error) {
      await logLoginAttempt(email, false);
      logger.error('Unexpected sign in error', { error, email });
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      logger.info('Starting sign up process', { email, fullName, userType });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            // Add any additional user metadata here
          }
        }
      });

      if (error) {
        logger.error('Sign up error', { error, email, fullName, userType });
        return { error: error as AuthError, data: null };
      }

      logger.info('Sign up successful', { email, fullName, userType });
      
      // Après l'inscription réussie, créer et envoyer le code OTP
      try {
        const otpResult = await otpService.createAndSendOTP(email, 'signup');
        if (!otpResult.success) {
          logger.warn('OTP creation failed after signup', { email, error: otpResult.message });
          // Ne pas bloquer l'inscription si l'OTP échoue
          toast({
            title: "Compte créé",
            description: "Votre compte a été créé mais l'envoi du code de vérification a échoué. Veuillez demander un nouveau code.",
            variant: "default",
          });
        } else {
          logger.info('OTP sent successfully after signup', { email });
          toast({
            title: "Compte créé",
            description: "Votre compte a été créé avec succès. Un code de vérification a été envoyé à votre email.",
            variant: "default",
          });
        }
      } catch (otpError) {
        logger.error('Error creating OTP after signup', { otpError, email });
        // Ne pas bloquer l'inscription si l'OTP échoue
        toast({
          title: "Compte créé",
          description: "Votre compte a été créé. Veuillez vérifier votre email pour le code de confirmation.",
          variant: "default",
        });
      }

      return { error: null, data: data.user };
    } catch (error) {
      logger.error('Unexpected sign up error', { error, email, fullName, userType });
      return { error: error as AuthError, data: null };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft', userType?: string) => {
    try {
      logger.info('Starting OAuth sign in', { provider, userType });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          queryParams: userType ? { user_type: userType } : undefined
        }
      });

      if (error) {
        logger.error('OAuth sign in error', { error: error.message, provider });
        return { error };
      }

      logger.info('OAuth sign in initiated', { provider });
      return { error: null };
    } catch (error) {
      logger.error('Unexpected OAuth sign in error', { error, provider });
      return { error: error as AuthError };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      logger.info('Starting OTP verification', { email, token: token.replace(/./g, '*') });

      // Étape 1: Vérifier le code OTP avec le service simplifié
      const otpResult = await otpService.verifyOTP(email, token, 'signup');

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

        // La vérification est déjà marquée dans le service simplifié
        // Plus besoin de mettre à jour la base de données
        logger.info('✅ [AUTH] User OTP verification completed', {
          userId: otpResult.user_id,
          email
        });

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
      } else {
        return { error: { message: 'Erreur inattendue lors de la vérification' } as AuthError };
      }

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
      logger.info('Starting sign out process', { userId: user?.id });
      setForceSigningOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out error', { error });
        toast({
          title: "Erreur de déconnexion",
          description: "Une erreur est survenue lors de la déconnexion",
          variant: "destructive",
        });
      } else {
        logger.info('Sign out successful');
        toast({
          title: "Déconnexion réussie",
          description: "Vous avez été déconnecté avec succès",
        });
        navigate('/auth');
      }

      // Réinitialiser l'état
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);

      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        setForceSigningOut(false);
      }, 1000);
    } catch (error) {
      logger.error('Unexpected sign out error', { error });
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    }
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    verifyOTP,
    signOut,
    refreshProfile,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};