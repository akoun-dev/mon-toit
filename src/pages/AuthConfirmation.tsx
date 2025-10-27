import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, RefreshCw, Key, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageTransition } from '@/components/animations/PageTransition';
import { MainLayout } from "@/components/layout/MainLayout";
import { KentePattern } from "@/components/ui/african-patterns";
import { motion } from "framer-motion";
import { useAuth } from '@/hooks/useAuthEnhanced';
import { otpService } from '@/services/otpService';

const AuthConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyOTP, user, profile } = useAuth();

  // Debug: Vérifier si la page se charge correctement
  console.log('🔍 [DEBUG] AuthConfirmation page loaded', {
    emailParam: searchParams.get('email'),
    currentPath: window.location.pathname,
    searchParams: window.location.search
  });

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté avec un profil complet, rediriger vers le dashboard
    if (user && profile && profile.full_name && searchParams.get('from') !== 'signup') {
      console.log('🔍 [DEBUG] User already has complete profile, redirecting to dashboard', {
        userId: user.id,
        email: user.email,
        profileId: profile.id,
        fullName: profile.full_name
      });
      navigate('/dashboard', { replace: true });
      return;
    }

    // Vérifier si l'email a déjà été vérifié avec OTP
    if (email) {
      const isAlreadyVerified = otpService.isEmailVerified(email, 'signup');
      if (isAlreadyVerified) {
        console.log('🔍 [DEBUG] Email already verified with OTP', { email });
        toast({
          title: "Email déjà vérifié",
          description: "Cet email a déjà été vérifié. Vous pouvez vous connecter directement.",
          variant: "default",
        });
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000);
        return;
      }
    }

    // Forcer l'affichage de la page OTP même en développement
    // Ne plus vérifier automatiquement si l'email est confirmé
    setLoading(false);
  }, [user, profile, navigate, searchParams, email]);

  const handleVerifyOTP = async () => {
    console.log('🔍 [DEBUG] Début de la vérification OTP', { email, otpCode: otpCode ? `${otpCode[0]}${otpCode[1]}****` : 'undefined', attempts });
    
    if (!email || !otpCode) {
      console.log('❌ [DEBUG] Champs manquants', { hasEmail: !!email, hasOtpCode: !!otpCode });
      toast({
        title: "Champs requis",
        description: "Veuillez entrer votre email et le code de vérification.",
        variant: "destructive",
      });
      return;
    }

    // Validation basique du code OTP (6 chiffres)
    if (!/^\d{6}$/.test(otpCode)) {
      console.log('❌ [DEBUG] Format OTP invalide', { otpCode, length: otpCode.length });
      toast({
        title: "Code invalide",
        description: "Le code doit contenir 6 chiffres.",
        variant: "destructive",
      });
      return;
    }

    // Limiter le nombre de tentatives
    if (attempts >= 5) {
      console.log('🚫 [DEBUG] Nombre maximum de tentatives atteint', { attempts });
      toast({
        title: "Trop de tentatives",
        description: "Pour des raisons de sécurité, veuillez demander un nouveau code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setLastError(null);
    setAttempts(attempts + 1);
    
    try {
      console.log('📡 [DEBUG] Appel à verifyOTP', { email });
      const { error } = await verifyOTP(email, otpCode);
      console.log('📡 [DEBUG] Réponse de verifyOTP', { error: error ? { message: error.message, code: error.status } : null });

      if (!error) {
        console.log('✅ [DEBUG] Vérification réussie');
        setIsVerified(true);

        // Afficher un message clair pour l'utilisateur
        toast({
          title: "Email vérifié !",
          description: "Votre compte a été vérifié avec succès. Vous allez être redirigé vers la page de connexion.",
          variant: "default",
        });

        // Rediriger vers la page de connexion pour que l'utilisateur se connecte avec ses identifiants
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000);
      } else {
        console.log('❌ [DEBUG] Erreur de vérification', { error: error.message, status: error.status });
        setLastError(error.message);
        
        // Message d'erreur spécifique selon le type d'erreur
        let errorMessage = error.message;
        if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
          errorMessage = "Le code est incorrect ou a expiré. Veuillez demander un nouveau code.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.";
        } else if (error.message.includes('User already registered') || error.message.includes('already verified')) {
          errorMessage = "Ce compte a déjà été vérifié. Vous pouvez vous connecter directement.";
        } else if (error.message.includes('User not found')) {
          errorMessage = "Aucun compte trouvé avec cet email. Veuillez d'abord vous inscrire.";
        }
        
        toast({
          title: "Erreur de vérification",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [DEBUG] Exception lors de la vérification OTP:', error);
      setLastError("Erreur technique inattendue");
      toast({
        title: "Erreur technique",
        description: "Une erreur technique est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    console.log('📤 [DEBUG] Demande de renvoi OTP', { email });

    if (!email) {
      console.log('❌ [DEBUG] Email manquant pour le renvoi');
      return;
    }

    setIsResending(true);
    try {
      // Utiliser le service OTP simplifié
      const otpResult = await otpService.createAndSendOTP(email, 'signup');

      if (otpResult.success) {
          console.log('✅ [DEBUG] Code OTP renvoyé avec succès');

          const mailpitUrl = import.meta.env.VITE_MAILPIT_URL;
          const description = mailpitUrl
            ? `Un nouveau code de vérification a été envoyé. Vérifiez dans Mailpit: ${mailpitUrl}`
            : "Un nouveau code de vérification a été envoyé à votre email. Pour les tests, utilisez: 123456";

          toast({
            title: "Code OTP renvoyé",
            description: description,
          });

          // Réinitialiser le champ OTP et les tentatives
          setOtpCode('');
          setAttempts(0);
          setLastError(null);
        } else {
          throw new Error(otpResult.message || 'Erreur lors de la génération du code');
        }
    } catch (error) {
      console.error('💥 [DEBUG] Exception lors du renvoi OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur d'envoi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToAuth = () => {
    navigate('/auth');
  };

  const handleGoToDashboard = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8 md:py-12 relative">
          <KentePattern />
          <div className="text-center relative z-10">
            <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Vérification du statut de votre compte...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isVerified) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8 md:py-12 relative">
          <KentePattern />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md sm:max-w-lg relative z-10"
          >
              <Card className="shadow-xl border-0">
                <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                  <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                    Compte confirmé !
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Votre adresse email a été confirmée avec succès.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-4 sm:px-6">
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Votre compte a été confirmé avec succès. Vous allez être redirigé vers la page de connexion pour vous identifier.
                  </p>
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full h-13 sm:h-15 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 rounded-xl"
                    size="lg"
                  >
                    Aller à la connexion
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8 md:py-12 relative">
        <KentePattern />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md sm:max-w-lg relative z-10"
        >
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                <Key className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                  Vérification par code
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Entrez le code à 6 chiffres envoyé à votre adresse email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong className="text-blue-900">Instructions importantes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm text-blue-800">
                      <li>Vérifiez votre boîte de réception (y compris les spams)</li>
                      <li>Le code expire après 24 heures</li>
                      <li>Entrez les 6 chiffres sans espaces</li>
                      <li>En cas de problème, utilisez "Renvoyer le code"</li>
                      {import.meta.env.DEV && import.meta.env.VITE_MAILPIT_URL && (
                        <li className="font-semibold text-blue-700">
                          🔍 Développement : Vérifiez les emails dans <a href={import.meta.env.VITE_MAILPIT_URL} target="_blank" rel="noopener noreferrer" className="underline">Mailpit</a>
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                        Code de vérification (6 chiffres)
                      </Label>
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                        {otpCode.length}/6
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          const newValue = e.target.value.replace(/\D/g, '');
                          console.log('⌨️ [DEBUG] Saisie OTP', { newValue, length: newValue.length });
                          setOtpCode(newValue);
                          setLastError(null); // Effacer l'erreur précédente lors de la saisie
                        }}
                        placeholder="000000"
                        className={`w-full text-center text-lg sm:text-xl font-mono tracking-widest h-12 sm:h-14 ${
                          lastError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' :
                          otpCode.length === 6 ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                        }`}
                        disabled={isVerifying}
                        aria-label="Code de vérification à 6 chiffres"
                        aria-describedby="otp-help otp-error"
                        aria-invalid={!!lastError}
                        autoComplete="one-time-code"
                      />
                      {otpCode.length === 6 && !lastError && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p id="otp-help" className="text-xs text-gray-500">
                        Entrez exactement 6 chiffres
                      </p>
                      {attempts > 0 && (
                        <p className="text-xs text-gray-500 font-medium">
                          Tentatives: {attempts}/5
                        </p>
                      )}
                    </div>
                    {lastError && (
                      <p id="otp-error" className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200" role="alert">
                        {lastError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      placeholder="votre@email.com"
                      className="w-full h-10 sm:h-11 bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                      disabled={isVerifying}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 px-4 sm:px-6 py-4 sm:py-6">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || !email || !otpCode || otpCode.length !== 6 || attempts >= 5}
                  className="w-full h-13 sm:h-15 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none rounded-xl"
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 mr-3 animate-spin" />
                      Vérification en cours...
                    </>
                  ) : attempts >= 5 ? (
                    <>
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                      Maximum de tentatives atteint
                    </>
                  ) : (
                    <>
                      <Key className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                      Vérifier le code
                    </>
                  )}
                </Button>

                <div className="flex gap-3 w-full">
                  <Button
                    onClick={handleResendOTP}
                    disabled={isResending || !email}
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-medium border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg"
                    variant="outline"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Renvoyer
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleBackToAuth}
                    variant="ghost"
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-sm transition-all duration-300 rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                </div>

                {/* Section d'aide pour le développement */}
                {import.meta.env.DEV && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2 text-sm">🧪 Mode Développement</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Code de test : <span className="font-mono bg-white px-2 py-1 rounded">123456</span></p>
                      <p>• Ou utilisez le bouton ci-dessous pour générer un code</p>
                    </div>
                    <Button
                      onClick={() => {
                        const testCode = otpService.generateTestCode(email);
                        toast({
                          title: "Code de test généré",
                          description: `Utilisez le code: ${testCode}`,
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Générer code de test
                    </Button>
                  </div>
                )}
              </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AuthConfirmation;