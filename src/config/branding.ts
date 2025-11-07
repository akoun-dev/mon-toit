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
  
  // Chatbot DONIA KOUMAN
  CHATBOT: {
    name_full: "DONIA KOUMAN",
    name_short: "Kouman",
    meaning: {
      donia: "maison / refuge / abri (dioula)",
      kouman: "parole / discours / échange (mandingue)",
      combined: "La maison qui parle"
    },
    tagline_fr: "La voix de la maison",
    tagline_dioula: "So ka kuma",
    personality: "Chaleureuse, respectueuse, pédagogique",
    voice: {
      gender: "féminine",
      tone: "douce",
      accent: "burkinabè léger"
    },
    languages: ["Français", "Dioula", "Anglais"],
    capabilities: [
      "Répondre aux questions sur logement/bail/quittance",
      "Guider les utilisateurs étape par étape",
      "Aider au paiement via Faso Arzeka",
      "Générer/lire documents PDF à voix haute",
      "Vérifier un bail par numéro de référence",
      "Envoyer rappels automatiques (WhatsApp/SMS)"
    ],
    visual: {
      icon: "bulle dorée avec onde sonore",
      colors: {
        primary: "#F9B208", // Or Soleil
        secondary: "#146B3A", // Vert Sahel
        tertiary: "#F5EDE0", // Beige Terre
        text: "#2C2C2C" // Gris Charbon
      },
      font: {
        title: "Poppins Bold",
        body: "Nunito Sans Regular"
      }
    }
  },
  
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
