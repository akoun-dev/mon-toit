/**
 * Configuration du branding DONIA
 * Toutes les constantes de marque, organisme certificateur et pays
 */

export const BRANDING = {
  // Produit/Service
  APP_NAME: "DONIA",
  APP_FULL_NAME: "DONIA - Plateforme Immobilière du Burkina Faso",
  APP_SHORT_NAME: "DONIA",
  APP_TAGLINE: "Votre maison, en toute confiance",
  APP_DESCRIPTION: "Le logement simple, sûr et burkinabè",
  APP_ORIGIN: "Du dioula « dɔniya » signifiant maison, abri, refuge",
  
  // Partenaires institutionnels
  PARTNERS: {
    developer: "Infosec Burkina",
    treasury: "Trésor public (Faso Arzeka)",
    certification: "Vérification DONIA",
  },
  
  // Système de vérification
  VERIFICATION_SYSTEM: {
    name: "Vérification DONIA",
    badge: "Vérifié DONIA",
    description: "Baux vérifiés par notre équipe",
    team: "équipe DONIA",
  },
  
  // Chatbot
  CHATBOT_NAME: "DONIABot",
  CHATBOT_PERSONALITY: "Bienveillante, pédagogique, nationale",
  CHATBOT_VOICE: "Féminine, calme, accent burkinabè léger",
  CHATBOT_LANGUAGES: ["Français", "Dioula", "Anglais"],
  
  // Messages de confiance
  TRUST_MESSAGES: {
    secure: "Plateforme sécurisée",
    verified: "Identité vérifiée",
    protected: "Données protégées",
    burkinabe: "100% burkinabè",
    partnership: "Développé par Infosec Burkina avec le Trésor public",
  },
  
  // Pays
  COUNTRY: "Burkina Faso",
  COUNTRY_ADJECTIVE: "burkinabè",
  COUNTRY_FLAG: "🇧🇫",
  CAPITAL_CITY: "Ouagadougou",
  
  // Contact
  EMAIL_CONTACT: "contact@donia.bf",
  EMAIL_PRIVACY: "privacy@donia.bf",
  PHONE: "+226 XX XX XX XX",
  
  // URLs
  WEBSITE_DOMAIN: "donia.bf",
  VERIFY_DOMAIN: "verify.donia.bf",
  APP_DOMAIN: "app.donia.bf",
  
  // Legal
  DATA_PROTECTION_LAW: "Loi N°010-2004/AN du 20 avril 2004",
} as const;
