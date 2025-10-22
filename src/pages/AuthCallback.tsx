import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);

        // Get the auth code and state from URL
        const code = searchParams.get('code');
        const userType = searchParams.get('userType') || 'proprietaire';

        logger.info('Processing OAuth callback', { hasCode: !!code, userType });

        if (!code) {
          throw new Error('Code d\'autorisation manquant');
        }

        // Complete the OAuth flow
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`Erreur de session: ${sessionError.message}`);
        }

        if (!data.session) {
          // If no session, try to get user from URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { error: tokenError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (tokenError) {
              throw new Error(`Erreur de token: ${tokenError.message}`);
            }
          } else {
            throw new Error('Aucune session trouvée');
          }
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error('Utilisateur non trouvé');
        }

        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          logger.info('Creating profile for OAuth user', { userId: user.id, userType });

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
              user_type: userType,
              avatar_url: user.user_metadata?.avatar_url || null,
              email: user.email,
              created_at: new Date().toISOString(),
            });

          if (profileError) {
            logger.error('Error creating profile', { error: profileError });
            throw new Error(`Erreur de création de profil: ${profileError.message}`);
          }
        }

        // Assign default role if not exists
        const { data: existingRoles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        if (!existingRoles || existingRoles.length === 0) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: userType === 'proprietaire' ? 'proprietaire' : 'user',
            });

          if (roleError) {
            logger.error('Error assigning role', { error: roleError });
          }
        }

        setSuccess(true);
        toast({
          title: "Connexion réussie !",
          description: `Bienvenue sur Mon Toit, ${user.user_metadata?.full_name || user.email} !`,
        });

        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error('OAuth callback error', { error: errorMessage });
        setError(errorMessage);

        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });

        // Redirect to auth page after short delay
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Finalisation de la connexion...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous configurons votre compte.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de connexion
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500">
            Vous allez être redirigé vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connexion réussie !
        </h2>
        <p className="text-gray-600">
          Bienvenue sur Mon Toit ! Redirection vers votre tableau de bord...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;