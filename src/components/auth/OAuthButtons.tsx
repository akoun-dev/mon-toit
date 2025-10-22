import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuthEnhanced';
import {
  Github,
  Chrome,
  Mail,
  Apple,
  Loader2
} from 'lucide-react';
import { useState } from 'react';

interface OAuthButtonsProps {
  userType?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const OAuthButtons = ({
  userType = 'proprietaire',
  className = '',
  variant = 'outline',
  size = 'default'
}: OAuthButtonsProps) => {
  const { signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft') => {
    setLoadingProvider(provider);

    try {
      const { error } = await signInWithOAuth(provider, userType);

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: `Impossible de se connecter avec ${provider}: ${error.message}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const oauthProviders = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: Chrome,
      color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
      label: 'Continuer avec Google'
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      icon: Github, // Temporarily using Github icon, replace with Facebook icon
      color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
      label: 'Continuer avec Facebook'
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: Apple,
      color: 'hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
      label: 'Continuer avec Apple'
    },
    {
      id: 'microsoft' as const,
      name: 'Microsoft',
      icon: Mail,
      color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
      label: 'Continuer avec Microsoft'
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      {oauthProviders.map((provider) => {
        const Icon = provider.icon;
        const isLoading = loadingProvider === provider.id;

        return (
          <Button
            key={provider.id}
            variant={variant}
            size={size}
            className={`w-full ${provider.color} transition-colors`}
            onClick={() => handleOAuthSignIn(provider.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Icon className="h-4 w-4 mr-2" />
            )}
            {provider.label}
          </Button>
        );
      })}

      <p className="text-xs text-muted-foreground text-center">
        En vous connectant, vous acceptez nos{' '}
        <a href="/conditions" className="underline hover:text-primary">
          conditions d'utilisation
        </a>{' '}
        et notre{' '}
        <a href="/confidentialite" className="underline hover:text-primary">
          politique de confidentialité
        </a>
      </p>
    </div>
  );
};

export default OAuthButtons;