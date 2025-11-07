import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import French translations
import commonFR from './locales/fr/common.json';
import authFR from './locales/fr/auth.json';
import propertyFR from './locales/fr/property.json';
import dashboardFR from './locales/fr/dashboard.json';
import paymentFR from './locales/fr/payment.json';
import contractFR from './locales/fr/contract.json';
import chatbotFR from './locales/fr/chatbot.json';

// Import Mooré translations
import commonMOS from './locales/mos/common.json';
import authMOS from './locales/mos/auth.json';
import propertyMOS from './locales/mos/property.json';
import dashboardMOS from './locales/mos/dashboard.json';
import paymentMOS from './locales/mos/payment.json';
import contractMOS from './locales/mos/contract.json';
import chatbotMOS from './locales/mos/chatbot.json';

// Import Dioula translations
import commonDYO from './locales/dyo/common.json';
import authDYO from './locales/dyo/auth.json';
import propertyDYO from './locales/dyo/property.json';
import dashboardDYO from './locales/dyo/dashboard.json';
import paymentDYO from './locales/dyo/payment.json';
import contractDYO from './locales/dyo/contract.json';
import chatbotDYO from './locales/dyo/chatbot.json';

// Import English translations
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import propertyEN from './locales/en/property.json';
import dashboardEN from './locales/en/dashboard.json';
import paymentEN from './locales/en/payment.json';
import contractEN from './locales/en/contract.json';
import chatbotEN from './locales/en/chatbot.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: commonFR,
        auth: authFR,
        property: propertyFR,
        dashboard: dashboardFR,
        payment: paymentFR,
        contract: contractFR,
        chatbot: chatbotFR,
      },
      mos: {
        common: commonMOS,
        auth: authMOS,
        property: propertyMOS,
        dashboard: dashboardMOS,
        payment: paymentMOS,
        contract: contractMOS,
        chatbot: chatbotMOS,
      },
      dyo: {
        common: commonDYO,
        auth: authDYO,
        property: propertyDYO,
        dashboard: dashboardDYO,
        payment: paymentDYO,
        contract: contractDYO,
        chatbot: chatbotDYO,
      },
      en: {
        common: commonEN,
        auth: authEN,
        property: propertyEN,
        dashboard: dashboardEN,
        payment: paymentEN,
        contract: contractEN,
        chatbot: chatbotEN,
      },
    },
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: ['common', 'auth', 'property', 'dashboard', 'payment', 'contract', 'chatbot'],
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mzaka-bf-language',
    },
  });

export default i18n;
