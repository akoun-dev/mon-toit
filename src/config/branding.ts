/**
 * Configuration du branding MZAKA-BF
 * Toutes les constantes de marque, organisme certificateur et pays
 */

export const BRANDING = {
  // Produit/Service
  APP_NAME: "MZAKA",
  APP_FULL_NAME: "MZAKA - Plateforme Immobilière du Burkina Faso",
  APP_SHORT_NAME: "MZAKA",
  APP_TAGLINE: "Le logement, en toute confiance",
  APP_DESCRIPTION: "Location sécurisée au Burkina Faso",
  
  // Système de vérification interne (privé)
  VERIFICATION_SYSTEM: {
    name: "Vérification MZAKA",
    badge: "Vérifié MZAKA",
    description: "Baux vérifiés par notre équipe",
    team: "équipe MZAKA",
  },
  
  // Messages de confiance (sans référence État)
  TRUST_MESSAGES: {
    secure: "Plateforme sécurisée",
    verified: "Identité vérifiée",
    protected: "Données protégées",
    burkinabe: "100% burkinabè",
  },
  
  // Pays
  COUNTRY: "Burkina Faso",
  COUNTRY_ADJECTIVE: "burkinabè",
  COUNTRY_FLAG: "🇧🇫",
  CAPITAL_CITY: "Ouagadougou",
  
  // Contact
  EMAIL_CONTACT: "contact@mzaka.bf",
  EMAIL_PRIVACY: "privacy@mzaka.bf",
  PHONE: "+226 XX XX XX XX",
  
  // URLs
  WEBSITE_DOMAIN: "mzaka.bf",
  VERIFY_DOMAIN: "verify.mzaka.bf",
  APP_DOMAIN: "app.mzaka.bf",
  
  // Legal
  DATA_PROTECTION_LAW: "Loi N°010-2004/AN du 20 avril 2004",
} as const;
