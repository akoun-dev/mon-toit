/**
 * Mapping des illustrations burkinabè générées par l'IA
 * Ces illustrations sont utilisées à travers l'application pour enrichir l'expérience visuelle
 */

export const illustrationPaths = {
  // Famille et maison burkinabè - Hero, Features
  'ivorian-family-house': '/src/assets/illustrations/burkinabe/ivorian-family-house.png',
  
  // Visite d'appartement - Features, Explorer
  'apartment-visit': '/src/assets/illustrations/burkinabe/apartment-visit.png',
  
  // Agent immobilier - Features, Confiance
  'real-estate-agent': '/src/assets/illustrations/burkinabe/real-estate-agent.png',
  
  // Quartier de Ouagadougou - Explorer, HowItWorks
  'ouagadougou-neighborhood': '/src/assets/illustrations/burkinabe/ouagadougou-neighborhood.png',
  
  // Salon moderne - PropertyCard, Explorer
  'modern-living-room': '/src/assets/illustrations/burkinabe/modern-living-room.png',
  
  // Skyline de Ouagadougou - Hero alternatif, Footer
  'ouagadougou-skyline': '/src/assets/illustrations/burkinabe/ouagadougou-skyline.png',
  
  // Remise de clés - Testimonials, Success page
  'key-handover': '/src/assets/illustrations/burkinabe/key-handover.png',
  
  // Famille en déménagement - HowItWorks, Onboarding
  'family-moving': '/src/assets/illustrations/burkinabe/family-moving.png',
  
  // Réunion copropriété - Admin, Agence Dashboard
  'co-ownership-meeting': '/src/assets/illustrations/burkinabe/co-ownership-meeting.png',
  
  // Vérification MZAKA - Confiance, CertificationBanner
  'verification-mzaka-illustration': '/src/assets/illustrations/burkinabe/verification-mzaka-illustration.png',
} as const;

export type IllustrationKey = keyof typeof illustrationPaths;

/**
 * Helper pour obtenir le chemin d'une illustration
 * @param key - La clé de l'illustration
 * @returns Le chemin de l'illustration ou undefined si non trouvée
 */
export const getIllustrationPath = (key: IllustrationKey): string | undefined => {
  return illustrationPaths[key];
};

/**
 * Helper pour obtenir le chemin optimisé d'une illustration (WebP)
 * @param key - La clé de l'illustration
 * @param format - Format souhaité ('webp' ou 'png')
 * @returns Le chemin optimisé de l'illustration ou undefined si non trouvée
 */
export const getOptimizedIllustrationPath = (
  key: IllustrationKey, 
  format: 'webp' | 'png' = 'webp'
): string | undefined => {
  const path = illustrationPaths[key];
  if (!path) return undefined;
  
  if (format === 'webp') {
    return path.replace('.png', '.webp');
  }
  return path;
};

/**
 * Vérifier si une illustration existe
 * @param key - La clé de l'illustration
 */
export const hasIllustration = (key: IllustrationKey): boolean => {
  return key in illustrationPaths;
};
