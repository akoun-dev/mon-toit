/**
 * Données des quartiers de Ouagadougou
 * Informations détaillées sur chaque quartier
 */

export interface Neighborhood {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  scores: {
    transport: number; // 0-10
    commerce: number; // 0-10
    education: number; // 0-10
    security: number; // 0-10
    healthcare: number; // 0-10
  };
  description: string;
  characteristics: string[];
  population?: number;
}

export const OUAGADOUGOU_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: 'ouaga-2000',
    name: 'Ouaga 2000',
    bounds: {
      north: 12.3850,
      south: 12.3650,
      east: -1.4900,
      west: -1.5200,
    },
    center: {
      latitude: 12.3750,
      longitude: -1.5050,
    },
    priceRange: {
      min: 200000,
      max: 600000,
      average: 400000,
    },
    scores: {
      transport: 8,
      commerce: 9,
      education: 9,
      security: 9,
      healthcare: 9,
    },
    description: 'Quartier moderne et résidentiel de Ouagadougou, prisé par les expatriés et cadres supérieurs.',
    characteristics: [
      'Quartier moderne et sécurisé',
      'Résidences haut de gamme',
      'Ambassades et institutions',
      'Centres commerciaux',
      'Sécurité renforcée',
    ],
    population: 50000,
  },
  {
    id: 'cissin',
    name: 'Cissin',
    bounds: {
      north: 12.3900,
      south: 12.3700,
      east: -1.5300,
      west: -1.5600,
    },
    center: {
      latitude: 12.3800,
      longitude: -1.5450,
    },
    priceRange: {
      min: 100000,
      max: 300000,
      average: 180000,
    },
    scores: {
      transport: 7,
      commerce: 8,
      education: 7,
      security: 7,
      healthcare: 7,
    },
    description: 'Quartier résidentiel en pleine expansion avec nombreux commerces et infrastructures modernes.',
    characteristics: [
      'Quartier résidentiel',
      'En pleine expansion',
      'Nombreux commerces',
      'Prix abordables',
      'Bon rapport qualité-prix',
    ],
    population: 80000,
  },
  {
    id: 'tampouy',
    name: 'Tampouy',
    bounds: {
      north: 12.4000,
      south: 12.3800,
      east: -1.4800,
      west: -1.5100,
    },
    center: {
      latitude: 12.3900,
      longitude: -1.4950,
    },
    priceRange: {
      min: 80000,
      max: 250000,
      average: 150000,
    },
    scores: {
      transport: 6,
      commerce: 7,
      education: 6,
      security: 6,
      healthcare: 6,
    },
    description: 'Quartier populaire et animé avec nombreux marchés et vie communautaire dynamique.',
    characteristics: [
      'Quartier populaire',
      'Marché animé',
      'Prix accessibles',
      'Transport facile',
      'Forte densité',
    ],
    population: 120000,
  },
  {
    id: 'gounghin',
    name: 'Gounghin',
    bounds: {
      north: 12.3650,
      south: 12.3450,
      east: -1.5100,
      west: -1.5400,
    },
    center: {
      latitude: 12.3550,
      longitude: -1.5250,
    },
    priceRange: {
      min: 120000,
      max: 350000,
      average: 220000,
    },
    scores: {
      transport: 8,
      commerce: 8,
      education: 7,
      security: 7,
      healthcare: 7,
    },
    description: 'Quartier central avec nombreuses institutions administratives et activités commerciales.',
    characteristics: [
      'Centre administratif',
      'Nombreuses institutions',
      'Bien desservi',
      'Activités commerciales',
      'Quartier stratégique',
    ],
    population: 90000,
  },
  {
    id: 'dapoya',
    name: 'Dapoya',
    bounds: {
      north: 12.3750,
      south: 12.3550,
      east: -1.5000,
      west: -1.5200,
    },
    center: {
      latitude: 12.3650,
      longitude: -1.5100,
    },
    priceRange: {
      min: 90000,
      max: 280000,
      average: 170000,
    },
    scores: {
      transport: 7,
      commerce: 9,
      education: 6,
      security: 6,
      healthcare: 6,
    },
    description: 'Grand quartier commerçant avec marché animé, au cœur de l\'activité économique.',
    characteristics: [
      'Grand marché',
      'Commerce intense',
      'Quartier animé',
      'Prix compétitifs',
      'Accès facile',
    ],
    population: 100000,
  },
  {
    id: 'somgande',
    name: 'Somgandé',
    bounds: {
      north: 12.4050,
      south: 12.3850,
      east: -1.5200,
      west: -1.5400,
    },
    center: {
      latitude: 12.3950,
      longitude: -1.5300,
    },
    priceRange: {
      min: 150000,
      max: 400000,
      average: 250000,
    },
    scores: {
      transport: 7,
      commerce: 7,
      education: 8,
      security: 8,
      healthcare: 7,
    },
    description: 'Quartier résidentiel classe moyenne avec nombreuses écoles et infrastructures modernes.',
    characteristics: [
      'Résidences modernes',
      'Quartier calme',
      'Écoles de qualité',
      'Sécurisé',
      'Classe moyenne',
    ],
    population: 70000,
  },
  {
    id: 'kossodo',
    name: 'Kossodo',
    bounds: {
      north: 12.4200,
      south: 12.4000,
      east: -1.4700,
      west: -1.4900,
    },
    center: {
      latitude: 12.4100,
      longitude: -1.4800,
    },
    priceRange: {
      min: 70000,
      max: 200000,
      average: 120000,
    },
    scores: {
      transport: 6,
      commerce: 6,
      education: 5,
      security: 5,
      healthcare: 5,
    },
    description: 'Zone industrielle et quartier en développement, prix très accessibles.',
    characteristics: [
      'Zone industrielle',
      'Prix très accessibles',
      'En développement',
      'Quartier ouvrier',
      'Forte croissance',
    ],
    population: 60000,
  },
  {
    id: 'zogona',
    name: 'Zogona',
    bounds: {
      north: 12.3700,
      south: 12.3500,
      east: -1.5200,
      west: -1.5400,
    },
    center: {
      latitude: 12.3600,
      longitude: -1.5300,
    },
    priceRange: {
      min: 100000,
      max: 300000,
      average: 180000,
    },
    scores: {
      transport: 8,
      commerce: 8,
      education: 6,
      security: 6,
      healthcare: 6,
    },
    description: 'Quartier central populaire, très bien desservi par les transports en commun.',
    characteristics: [
      'Quartier central',
      'Populaire',
      'Bien desservi',
      'Commerces locaux',
      'Forte densité',
    ],
    population: 85000,
  },
  {
    id: 'patte-doie',
    name: 'Patte d\'Oie',
    bounds: {
      north: 12.3950,
      south: 12.3750,
      east: -1.5400,
      west: -1.5600,
    },
    center: {
      latitude: 12.3850,
      longitude: -1.5500,
    },
    priceRange: {
      min: 130000,
      max: 380000,
      average: 240000,
    },
    scores: {
      transport: 7,
      commerce: 7,
      education: 7,
      security: 8,
      healthcare: 7,
    },
    description: 'Quartier résidentiel calme avec nombreuses écoles et espaces verts.',
    characteristics: [
      'Quartier résidentiel',
      'Calme et sécurisé',
      'Écoles',
      'Espaces verts',
      'Vie de quartier',
    ],
    population: 65000,
  },
  {
    id: 'bogodogo',
    name: 'Bogodogo',
    bounds: {
      north: 12.3550,
      south: 12.3350,
      east: -1.4800,
      west: -1.5000,
    },
    center: {
      latitude: 12.3450,
      longitude: -1.4900,
    },
    priceRange: {
      min: 60000,
      max: 180000,
      average: 110000,
    },
    scores: {
      transport: 5,
      commerce: 6,
      education: 5,
      security: 5,
      healthcare: 5,
    },
    description: 'Quartier en expansion rapide, prix très accessibles pour les jeunes familles.',
    characteristics: [
      'Quartier en expansion',
      'Prix très accessibles',
      'Jeune population',
      'En développement',
      'Opportunités',
    ],
    population: 95000,
  },
];

// Fonction utilitaire pour obtenir la couleur selon le prix moyen
export const getPriceColor = (avgPrice: number): string => {
  if (avgPrice < 150000) return '#10b981'; // Vert - Abordable
  if (avgPrice < 300000) return '#f59e0b'; // Orange - Moyen
  if (avgPrice < 500000) return '#ef4444'; // Rouge - Cher
  return '#8b5cf6'; // Violet - Très cher
};

// Fonction pour obtenir le label de prix
export const getPriceLabel = (avgPrice: number): string => {
  if (avgPrice < 150000) return '< 150k FCFA';
  if (avgPrice < 300000) return '150k - 300k FCFA';
  if (avgPrice < 500000) return '300k - 500k FCFA';
  return '> 500k FCFA';
};
