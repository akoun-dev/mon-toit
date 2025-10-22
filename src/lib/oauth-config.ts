// Configuration OAuth pour Mon Toit
// Ce fichier définit les paramètres pour chaque provider OAuth

export const OAUTH_CONFIG = {
  google: {
    name: 'Google',
    displayName: 'Google',
    scopes: ['email', 'profile'],
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
    icon: 'Chrome',
    color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
    label: 'Continuer avec Google',
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    scopes: ['email', 'public_profile'],
    queryParams: {},
    icon: 'Github', // TODO: Replace with Facebook icon
    color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
    label: 'Continuer avec Facebook',
  },
  apple: {
    name: 'apple',
    displayName: 'Apple',
    scopes: ['email', 'name'],
    queryParams: {},
    icon: 'Apple',
    color: 'hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
    label: 'Continuer avec Apple',
  },
  microsoft: {
    name: 'azure', // Supabase utilise 'azure' pour Microsoft
    displayName: 'Microsoft',
    scopes: ['email', 'profile'],
    queryParams: {},
    icon: 'Mail',
    color: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
    label: 'Continuer avec Microsoft',
  },
} as const;

export type OAuthProvider = keyof typeof OAUTH_CONFIG;

export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  scopes: string[];
  queryParams: Record<string, string>;
  icon: string;
  color: string;
  label: string;
}

/**
 * Instructions de configuration pour Supabase
 *
 * Pour activer l'authentification OAuth, vous devez configurer chaque provider
 * dans la console Supabase sous Authentication > Providers.
 *
 * 1. Google OAuth:
 *    - Activer le provider Google dans Supabase
 *    - Ajouter votre Client ID et Client Secret
 *    - Configurer l'URL de redirection: https://votre-domaine.com/auth/callback
 *
 * 2. Facebook OAuth:
 *    - Activer le provider Facebook dans Supabase
 *    - Créer une app Facebook Developers
 *    - Ajouter Facebook Login product
 *    - Configurer les OAuth Redirect URIs
 *
 * 3. Apple OAuth:
 *    - Activer le provider Apple dans Supabase
 *    - Avoir un compte Apple Developer
 *    - Configurer Sign in with Apple
 *    - Ajouter les domaines autorisés
 *
 * 4. Microsoft OAuth:
 *    - Activer le provider Azure dans Supabase
 *    - Créer une app dans Azure Portal
 *    - Configurer l'authentication
 *    - Ajouter les redirect URIs
 */

export const OAUTH_CALLBACK_URL = `${window.location.origin}/auth/callback`;