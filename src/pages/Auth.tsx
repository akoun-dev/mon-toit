import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Home, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify';
import { toast } from '@/hooks/use-toast';
import { getClientIP, getDeviceFingerprint, formatRetryAfter } from '@/lib/ipUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/services/logger';
import { PageTransition } from '@/components/animations/PageTransition';
import { MainLayout } from "@/components/layout/MainLayout";
import { BrandBar } from '@/components/ui/brand-bar';
import { QuickNav } from "@/components/navigation/QuickNav";
import { LazyIllustration } from "@/components/illustrations/LazyIllustration";
import { getIllustrationPath } from "@/lib/utils";
import { KentePattern } from "@/components/ui/african-patterns";
import { motion } from "framer-motion";

const signUpSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
    .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une minuscule" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" })
    .regex(/[^A-Za-z0-9]/, { message: "Le mot de passe doit contenir au moins un caractère spécial" }),
  fullName: z.string().min(2, { message: "Le nom complet doit contenir au moins 2 caractères" }),
  userType: z.enum(['locataire', 'proprietaire', 'agence']),
});

const signInSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

type ValidationErrors = Partial<Record<'email' | 'password' | 'fullName' | 'userType', string>>;

const Auth = () => {
  const { signUp, signIn, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lire le type depuis l'URL
  const userTypeFromUrl = searchParams.get('type') as 'locataire' | 'proprietaire' | 'agence' | null;

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'locataire' | 'proprietaire' | 'agence'>(userTypeFromUrl || 'locataire');
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});

  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Rate limiting states
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [retryAfter, setRetryAfter] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // Si l'utilisateur est déjà connecté et essaie d'accéder à /auth avec un type
      // (ex: /auth?type=agence), on le redirige vers son profil pour gérer ses rôles
      if (userTypeFromUrl && userTypeFromUrl !== user.user_metadata?.user_type) {
        toast({
          title: "Déjà connecté",
          description: "Vous êtes déjà connecté. Rendez-vous dans votre profil pour gérer vos rôles.",
        });
        navigate('/profil', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate, userTypeFromUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    
    const validation = signUpSchema.safeParse({
      email: signUpEmail,
      password: signUpPassword,
      fullName,
      userType,
    });

    if (!validation.success) {
      const errors: ValidationErrors = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setSignUpErrors(errors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, fullName, userType);
    setLoading(false);

    if (!error) {
      navigate('/');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    setIsBlocked(false);

    const validation = signInSchema.safeParse({
      email: signInEmail,
      password: signInPassword,
    });

    if (!validation.success) {
      const errors: ValidationErrors = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setSignInErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Get IP and fingerprint
      const ipAddress = await getClientIP();
      const fingerprint = getDeviceFingerprint();

      // Check rate limit before attempting sign in
      const { data: rateLimitCheck } = await supabase.rpc('check_login_rate_limit', {
        _email: signInEmail,
        _ip_address: ipAddress
      }) as { data: { allowed: boolean; reason?: string; retry_after?: string; blocked?: boolean; show_captcha?: boolean; failed_count?: number } | null };

      if (rateLimitCheck && typeof rateLimitCheck === 'object' && 'allowed' in rateLimitCheck && !rateLimitCheck.allowed) {
        setIsBlocked(true);
        setBlockMessage(rateLimitCheck.reason || 'Trop de tentatives');
        if (rateLimitCheck.retry_after) {
          setRetryAfter(formatRetryAfter(rateLimitCheck.retry_after));
        }
        setLoading(false);
        return;
      }

      const { error } = await signIn(signInEmail, signInPassword);

      // Log login attempt
      await supabase.from('login_attempts').insert({
        email: signInEmail,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        success: !error,
        fingerprint: fingerprint
      });

      setLoading(false);

      if (!error) {
        // Check if user is admin and requires 2FA
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id);

          const isAdmin = roles?.some(r => r.role === 'admin');

          if (isAdmin) {
            // Check if 2FA is enabled
            const { data: factors } = await supabase.auth.mfa.listFactors();
            
            if (factors?.totp && factors.totp.length > 0) {
              setPendingUserId(currentUser.id);
              setShow2FA(true);
              return;
            }
          }
        }

        navigate('/');
      }
    } catch (err) {
      logger.logError(err, { context: 'Auth', action: 'signIn', email: signInEmail });
      setLoading(false);
    }
  };

  const handle2FAVerified = () => {
    setShow2FA(false);
    setPendingUserId(null);
    navigate('/');
  };

  const handle2FACancel = async () => {
    await supabase.auth.signOut();
    setShow2FA(false);
    setPendingUserId(null);
  };

  const handleForgotPassword = async () => {
    if (!signInEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre email d'abord",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(signInEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email envoyé",
        description: "Consultez votre boîte mail pour réinitialiser votre mot de passe",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        logger.logError(error, { context: 'Auth', action: 'googleOAuth', stage: 'initial' });
        throw error;
      }

      if (!data.url) {
        throw new Error('Aucune URL de redirection OAuth reçue');
      }

      // La redirection vers Google se fera automatiquement
      logger.debug('Redirection vers Google OAuth', { url: data.url });
      
    } catch (error: any) {
      logger.logError(error, { context: 'Auth', action: 'googleSignIn', stage: 'complete' });
      
      let errorMessage = 'Impossible de se connecter avec Google';
      
      if (error.message?.includes('OAuth')) {
        errorMessage = 'Le service Google OAuth n\'est pas configuré ou temporairement indisponible. Veuillez utiliser l\'email et le mot de passe pour vous connecter.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de connexion Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        logger.logError(error, { context: 'Auth', action: 'facebookOAuth', stage: 'initial' });
        throw error;
      }

      if (!data.url) {
        throw new Error('Aucune URL de redirection OAuth reçue');
      }

      logger.debug('Redirection vers Facebook OAuth', { url: data.url });
    } catch (error: any) {
      logger.logError(error, { context: 'Auth', action: 'facebookSignIn', stage: 'complete' });
      let errorMessage = "Impossible de se connecter avec Facebook";
      if (error?.message) errorMessage = error.message;
      toast({ title: 'Erreur de connexion Facebook', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        logger.logError(error, { context: 'Auth', action: 'appleOAuth', stage: 'initial' });
        throw error;
      }

      if (!data.url) {
        throw new Error('Aucune URL de redirection OAuth reçue');
      }

      logger.debug('Redirection vers Apple OAuth', { url: data.url });
    } catch (error: any) {
      logger.logError(error, { context: 'Auth', action: 'appleSignIn', stage: 'complete' });
      let errorMessage = "Impossible de se connecter avec Apple";
      if (error?.message) errorMessage = error.message;
      toast({ title: 'Erreur de connexion Apple', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        logger.logError(error, { context: 'Auth', action: 'microsoftOAuth', stage: 'initial' });
        throw error;
      }

      if (!data.url) {
        throw new Error('Aucune URL de redirection OAuth reçue');
      }

      logger.debug('Redirection vers Microsoft OAuth', { url: data.url });
    } catch (error: any) {
      logger.logError(error, { context: 'Auth', action: 'microsoftSignIn', stage: 'complete' });
      let errorMessage = "Impossible de se connecter avec Microsoft";
      if (error?.message) errorMessage = error.message;
      toast({ title: 'Erreur de connexion Microsoft', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TwoFactorVerify
              onVerified={handle2FAVerified}
              onCancel={handle2FACancel}
            />
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative">
        {/* Hero Section with Pattern */}
        <section className="relative pt-12 pb-6 md:pt-16 md:pb-8 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10">
          <KentePattern />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-6 md:mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h1
                  className="text-3xl sm:text-4xl md:text-h1 mb-3 md:mb-4 mt-2 md:mt-6 px-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Bienvenue sur <span className="text-gradient-primary">Mon Toit</span>
                </motion.h1>
                <motion.p
                  className="text-sm sm:text-base md:text-body-lg text-muted-foreground mb-6 md:mb-8 px-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  La plateforme immobilière certifiée ANSUT pour la Côte d'Ivoire
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 pb-8 md:pb-12">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start max-w-6xl mx-auto">
            {/* Left Side - Benefits */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >

              <div className="space-y-6 bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/50 shadow-lg">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">
                  Pourquoi choisir Mon Toit ?
                </h2>
                <ul className="space-y-3 md:space-y-4">
                  <motion.li
                    className="flex items-start gap-3 md:gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1 text-sm md:text-base">Sécurité garantie</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Tous les utilisateurs sont vérifiés par l'ANSUT</p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3 md:gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Home className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1 text-sm md:text-base">Biens certifiés</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Des logements vérifiés et conformes</p>
                    </div>
                  </motion.li>
                </ul>
              </div>

              <QuickNav variant="auth" />
            </motion.div>

            {/* Right Side - Auth Form */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Tabs defaultValue="signin" className="w-full">
                {/* Responsive tabs: stack on mobile, auto height to avoid overlap */}
                <TabsList className="w-full !h-auto flex flex-col sm:flex-row items-stretch gap-2">
                  <TabsTrigger value="signin" className="w-full sm:flex-1 text-xs md:text-sm font-medium px-2 md:px-3">Connexion</TabsTrigger>
                  <TabsTrigger value="signup" className="w-full sm:flex-1 text-xs md:text-sm font-medium px-2 md:px-3">Inscription</TabsTrigger>
                </TabsList>

          {/* Sign In Tab */}
                <TabsContent value="signin">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="shadow-lg md:shadow-xl border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30 px-4 py-4 md:px-6">
                        <CardTitle className="text-lg md:text-xl font-semibold text-center">Connexion</CardTitle>
                        <CardDescription className="text-center text-sm md:text-base">
                          Connectez-vous à votre compte Mon Toit
                        </CardDescription>
                        {userTypeFromUrl && (
                          <motion.p
                            className="text-xs text-muted-foreground mt-3 bg-muted/70 p-3 rounded-lg border border-border/30"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            💡 <strong>Vous avez déjà un compte ?</strong> Connectez-vous puis gérez vos rôles depuis <Link to="/profil" className="text-primary hover:underline font-medium">votre profil</Link>
                          </motion.p>
                        )}
                      </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-3 md:space-y-4 px-4 py-4 md:px-6">
                  {isBlocked && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {blockMessage}
                        {retryAfter && ` Réessayez dans ${retryAfter}.`}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm md:text-base">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      className="h-10 md:h-11"
                    />
                    {signInErrors.email && (
                      <p className="text-xs md:text-sm text-destructive">{signInErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm md:text-base">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className="h-10 md:h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showSignInPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signInErrors.password && (
                      <p className="text-xs md:text-sm text-destructive">{signInErrors.password}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs md:text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3 px-4 py-4 md:px-6">
                  <Button type="submit" className="w-full h-10 md:h-11 text-sm md:text-base" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continuer avec
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 md:h-11 text-sm md:text-base"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 md:h-11 text-sm md:text-base"
                      onClick={handleFacebookSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24H12.82v-9.294H9.692V11.08h3.128V8.414c0-3.1 1.893-4.79 4.659-4.79 1.325 0 2.462.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.31h3.59l-.467 3.626h-3.123V24h6.125C23.407 24 24 23.407 24 22.676V1.324C24 .593 23.407 0 22.676 0"/>
                      </svg>
                      Facebook
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 md:h-11 text-sm md:text-base"
                      onClick={handleAppleSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M16.365 1.43c0 1.14-.417 2.133-1.251 2.975-.929.96-1.992 1.5-3.185 1.415-.048-1.103.458-2.095 1.285-2.93.898-.91 2.093-1.49 3.151-1.46zM20.814 17.42c-.594 1.387-.878 1.99-1.648 3.21-1.07 1.68-2.573 3.77-4.43 3.79-1.654.017-2.083-1.106-4.331-1.095-2.248.01-2.72 1.113-4.374 1.096-1.857-.018-3.286-1.905-4.357-3.585-2.977-4.68-3.294-10.17-1.46-13.06 1.3-2.107 3.357-3.34 5.3-3.34 1.966 0 3.204 1.12 4.83 1.12 1.592 0 2.46-1.123 4.84-1.123 1.73 0 3.56.944 4.86 2.57-4.27 2.33-3.58 8.41.77 10.318z"/>
                      </svg>
                      Apple
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 md:h-11 text-sm md:text-base"
                      onClick={handleMicrosoftSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                      </svg>
                      Microsoft
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
                  </motion.div>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="shadow-xl border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
                      <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5 border-b border-border/30">
                        <CardTitle className="text-xl font-semibold text-center">Inscription</CardTitle>
                        <CardDescription className="text-center">
                          {userTypeFromUrl === 'agence' && 'Créez votre compte Agence immobilière'}
                          {userTypeFromUrl === 'proprietaire' && 'Créez votre compte Propriétaire'}
                          {userTypeFromUrl === 'locataire' && 'Créez votre compte Locataire'}
                          {!userTypeFromUrl && 'Créez votre compte Mon Toit'}
                        </CardDescription>
                        {userTypeFromUrl && (
                          <motion.p
                            className="text-xs text-muted-foreground mt-3 bg-muted/70 p-3 rounded-lg border border-border/30"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                          >
                            💡 <strong>Vous voulez ajouter ce rôle à un compte existant ?</strong> Connectez-vous puis <Link to="/profil" className="text-primary hover:underline font-medium">gérez vos rôles depuis votre profil</Link>
                          </motion.p>
                        )}
                      </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nom complet</Label>
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="Jean Kouamé"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    {signUpErrors.fullName && (
                      <p className="text-sm text-destructive">{signUpErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                    {signUpErrors.email && (
                      <p className="text-sm text-destructive">{signUpErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showSignUpPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signUpErrors.password && (
                      <p className="text-sm text-destructive">{signUpErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usertype">Type de compte</Label>
                    <Select value={userType} onValueChange={(value: 'locataire' | 'proprietaire' | 'agence') => setUserType(value)}>
                      <SelectTrigger id="usertype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="locataire">🏠 Locataire - Je cherche un logement</SelectItem>
                        <SelectItem value="proprietaire">🏢 Propriétaire - Je loue mes biens</SelectItem>
                        <SelectItem value="agence">🏪 Agence - Je gère un portfolio</SelectItem>
                      </SelectContent>
                    </Select>
                    {signUpErrors.userType && (
                      <p className="text-sm text-destructive">{signUpErrors.userType}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 px-4 py-4 md:px-6">
                  <Button type="submit" className="w-full h-10 md:h-11 text-sm md:text-base" disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </Button>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Plateforme certifiée ANSUT</span>
                  </div>
                </CardFooter>
              </form>
            </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>

            {/* Footer */}
            <motion.p
              className="text-center text-sm text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              En créant un compte, vous acceptez nos{' '}
              <Link to="/conditions" className="text-primary hover:underline font-medium">
                conditions d'utilisation
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
