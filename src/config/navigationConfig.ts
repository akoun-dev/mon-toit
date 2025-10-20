// Configuration centralisée des routes de navigation
export const ROUTES = {
  // Pages principales
  HOME: '/',
  EXPLORER: '/explorer',
  PUBLISH: '/publier',
  GUIDE: '/guide',
  
  // Utilisateur
  DASHBOARD: '/dashboard',
  PROFILE: '/profil',
  FAVORITES: '/favoris',
  MESSAGES: '/messages',
  VERIFICATION: '/verification',
  
  // Propriétaire/Agence
  MY_PROPERTIES: '/mes-biens',
  MY_MANDATES: '/my-mandates',
  
  // Locataire
  APPLICATIONS: '/candidatures',
  LEASES: '/baux',
  PAYMENTS: '/payments',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_CERTIFICATIONS: '/admin/certifications',
  
  // Autres
  AUTH: '/auth',
  CERTIFICATION: '/certification',
  PRICING: '/tarifs',
  ABOUT: '/a-propos',
} as const;

// Configuration des libellés de navigation
export const NAV_LABELS = {
  [ROUTES.HOME]: 'Accueil',
  [ROUTES.EXPLORER]: 'Recherche',
  [ROUTES.PUBLISH]: 'Publier',
  [ROUTES.GUIDE]: 'Guide',
  [ROUTES.DASHBOARD]: 'Tableau de bord',
  [ROUTES.PROFILE]: 'Mon profil',
  [ROUTES.FAVORITES]: 'Mes Favoris',
  [ROUTES.MESSAGES]: 'Messages',
  [ROUTES.VERIFICATION]: 'Vérification',
  [ROUTES.MY_PROPERTIES]: 'Mes Biens',
  [ROUTES.MY_MANDATES]: 'Mes Mandats',
  [ROUTES.APPLICATIONS]: 'Mes Candidatures',
  [ROUTES.LEASES]: 'Mes Baux',
  [ROUTES.PAYMENTS]: 'Paiements',
  [ROUTES.ADMIN]: 'Admin Dashboard',
  [ROUTES.ADMIN_CERTIFICATIONS]: 'Certifications ANSUT',
  [ROUTES.AUTH]: 'Connexion',
  [ROUTES.CERTIFICATION]: 'Certification ANSUT',
  [ROUTES.PRICING]: 'Tarifs',
  [ROUTES.ABOUT]: 'À propos',
} as const;

// Navigation principale (header)
export const MAIN_NAVIGATION = [
  { to: ROUTES.EXPLORER, label: NAV_LABELS[ROUTES.EXPLORER] },
  { to: ROUTES.PUBLISH, label: NAV_LABELS[ROUTES.PUBLISH] },
  { to: ROUTES.GUIDE, label: NAV_LABELS[ROUTES.GUIDE] },
] as const;

// Navigation mobile (bottom)
export const MOBILE_NAVIGATION = [
  { to: ROUTES.HOME, label: NAV_LABELS[ROUTES.HOME], needsAuth: false },
  { to: ROUTES.EXPLORER, label: NAV_LABELS[ROUTES.EXPLORER], needsAuth: false },
  { to: ROUTES.FAVORITES, label: NAV_LABELS[ROUTES.FAVORITES], needsAuth: true },
  { to: ROUTES.MESSAGES, label: NAV_LABELS[ROUTES.MESSAGES], needsAuth: true },
  { to: ROUTES.PROFILE, label: NAV_LABELS[ROUTES.PROFILE], needsAuth: true },
] as const;

// Navigation menu mobile (hamburger)
export const MOBILE_MENU_NAVIGATION = [
  { to: ROUTES.CERTIFICATION, label: NAV_LABELS[ROUTES.CERTIFICATION], needsAuth: false },
  { to: ROUTES.PRICING, label: NAV_LABELS[ROUTES.PRICING], needsAuth: false },
  { to: ROUTES.VERIFICATION, label: NAV_LABELS[ROUTES.VERIFICATION], needsAuth: true },
] as const;