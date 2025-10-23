import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuthEnhanced';
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
import OAuthButtons from '@/components/auth/OAuthButtons';

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
  userType: z.enum(['locataire', 'proprietaire', 'agence', 'tiers_de_confiance']),
});

const signInSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

type ValidationErrors = Partial<Record<'email' | 'password' | 'fullName' | 'userType', string>>;

const Auth = () => {
  const { signUp, signIn, user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lire le type depuis l'URL
  const userTypeFromUrl = searchParams.get('type') as 'locataire' | 'proprietaire' | 'agence' | 'tiers_de_confiance' | null;

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'locataire' | 'proprietaire' | 'agence' | 'tiers_de_confiance'>(userTypeFromUrl || 'locataire');
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

  // Email confirmation state
  
  // Redirect if already authenticated and has active session
  useEffect(() => {
    // Si l'utilisateur est déjà connecté avec une session active et un email confirmé
    // rediriger selon le type d'utilisateur
    if (user && session && user.email_confirmed_at) {
      // Si l'utilisateur est déjà connecté et essaie d'accéder à /auth avec un type
      // (ex: /auth?type=agence), on le redirige vers son profil pour gérer ses rôles
      if (userTypeFromUrl && userTypeFromUrl !== user.user_metadata?.user_type) {
        toast({
          title: "Déjà connecté",
          description: "Vous êtes déjà connecté. Rendez-vous dans votre profil pour gérer vos rôles.",
        });
        navigate('/profil', { replace: true });
      } else {
        // Rediriger vers la page de confirmation OTP plutôt que dashboard
        navigate('/auth/confirmation', { replace: true });
      }
    }
  }, [user, session, navigate, userTypeFromUrl]);

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
    const { error, data } = await signUp(signUpEmail, signUpPassword, fullName, userType);
    setLoading(false);

    if (!error) {
      // Rediriger vers la page de confirmation avec l'email
      const confirmationUrl = `/auth/confirmation?email=${encodeURIComponent(signUpEmail)}`;
      navigate(confirmationUrl, { replace: true });

      // Réinitialiser le formulaire
      setSignUpEmail('');
      setSignUpPassword('');
      setFullName('');
      setUserType('locataire');
      setSignUpErrors({});
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
      // Login attempts are logged centrally in useAuthEnhanced.tsx

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
            // Check if 2FA is enabled - MFA is now MANDATORY for all admins
            const { data: factors } = await supabase.auth.mfa.listFactors();

            if (factors?.totp && factors.totp.length > 0) {
              // 2FA is enabled, proceed to verification
              setPendingUserId(currentUser.id);
              setShow2FA(true);
              return;
            } else {
              // 2FA is NOT enabled - deny access and show error
              toast({
                title: "Accès refusé",
                description: "L'authentification à deux facteurs (2FA) est obligatoire pour tous les administrateurs. Veuillez configurer d'abord votre 2FA.",
                variant: "destructive",
              });
              await supabase.auth.signOut();
              setLoading(false);
              return;
            }
          }
        }

        navigate('/dashboard');
      }
    } catch (err) {
      logger.logError(err, { context: 'Auth', action: 'signIn', email: signInEmail });
      setLoading(false);
    }
  };

  const handle2FAVerified = () => {
    setShow2FA(false);
    setPendingUserId(null);
    navigate('/dashboard');
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

  
  if (show2FA) {
    return (
      <MainLayout>
        <div className="container mx-auto px-2 py-4 max-w-md">
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
          <div className="container mx-auto px-2 sm:px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-3 md:mb-4">
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
                  className="text-sm sm:text-base md:text-body-lg text-muted-foreground mb-3 md:mb-4 px-4"
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
        <div className="container mx-auto px-2 sm:px-4 pb-8 md:pb-12">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start max-w-6xl mx-auto">
            {/* Left Side - Benefits */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >

              <div className="space-y-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/50 shadow-lg">
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
              className="space-y-4"
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
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30 px-4 py-4 md:px-4">
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
                <CardContent className="space-y-3 md:space-y-4 px-4 py-4 md:px-4">
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
                <CardFooter className="flex-col gap-3 px-4 py-4 md:px-4">
                  <Button type="submit" className="w-full h-10 md:h-11 text-sm md:text-base" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>

                  <OAuthButtons
                    userType={userType}
                    className="mt-4"
                    variant="outline"
                    size="default"
                  />
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
                    <Select value={userType} onValueChange={(value: 'locataire' | 'proprietaire' | 'agence' | 'tiers_de_confiance') => setUserType(value)}>
                      <SelectTrigger id="usertype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="locataire">🏠 Locataire - Je cherche un logement</SelectItem>
                        <SelectItem value="proprietaire">🏢 Propriétaire - Je loue mes biens</SelectItem>
                        <SelectItem value="agence">🏪 Agence - Je gère un portfolio</SelectItem>
                        <SelectItem value="tiers_de_confiance">🤝 Tiers de confiance - Intermédiaire certifié</SelectItem>
                      </SelectContent>
                    </Select>
                    {signUpErrors.userType && (
                      <p className="text-sm text-destructive">{signUpErrors.userType}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 px-4 py-4 md:px-4">
                  <Button type="submit" className="w-full h-10 md:h-11 text-sm md:text-base" disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </Button>

                  <OAuthButtons
                    userType={userType}
                    className="mt-4"
                    variant="outline"
                    size="default"
                  />

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
