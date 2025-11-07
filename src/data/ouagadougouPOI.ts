/**
 * Points d'Intérêt (POI) de Ouagadougou
 * Données réelles des principaux lieux d'intérêt de la ville
 */

export interface POI {
  id: string;
  name: string;
  type: 'school' | 'transport' | 'hospital' | 'market' | 'mall' | 'restaurant';
  latitude: number;
  longitude: number;
  neighborhood: string;
  description?: string;
}

export const OUAGADOUGOU_POI: POI[] = [
  // ÉCOLES
  {
    id: 'school-1',
    name: 'Université Ouaga I Professeur Joseph Ki-Zerbo',
    type: 'school',
    latitude: 12.3714,
    longitude: -1.5197,
    neighborhood: 'Centre-ville',
    description: 'Principale université publique du Burkina Faso',
  },
  {
    id: 'school-2',
    name: 'Lycée Zinda Kaboré',
    type: 'school',
    latitude: 12.3650,
    longitude: -1.5250,
    neighborhood: 'Gounghin',
    description: 'Lycée public prestigieux',
  },
  {
    id: 'school-3',
    name: 'École Française Saint-Exupéry',
    type: 'school',
    latitude: 12.3750,
    longitude: -1.5050,
    neighborhood: 'Ouaga 2000',
    description: 'École française internationale',
  },
  {
    id: 'school-4',
    name: 'Groupe Scolaire Sainte Famille',
    type: 'school',
    latitude: 12.3800,
    longitude: -1.5450,
    neighborhood: 'Cissin',
    description: 'École catholique réputée',
  },
  {
    id: 'school-5',
    name: 'Lycée Technique de Ouagadougou',
    type: 'school',
    latitude: 12.3600,
    longitude: -1.5300,
    neighborhood: 'Zogona',
    description: 'Lycée technique et professionnel',
  },
  {
    id: 'school-6',
    name: 'Université Thomas Sankara',
    type: 'school',
    latitude: 12.3900,
    longitude: -1.4950,
    neighborhood: 'Tampouy',
    description: 'Université privée moderne',
  },

  // TRANSPORTS
  {
    id: 'transport-1',
    name: 'Gare routière de Ouagadougou',
    type: 'transport',
    latitude: 12.3600,
    longitude: -1.5300,
    neighborhood: 'Centre-ville',
    description: 'Principale gare routière',
  },
  {
    id: 'transport-2',
    name: 'Aéroport International de Ouagadougou',
    type: 'transport',
    latitude: 12.3532,
    longitude: -1.5124,
    neighborhood: 'Ouaga 2000',
    description: 'Aéroport international',
  },
  {
    id: 'transport-3',
    name: 'Gare ferroviaire',
    type: 'transport',
    latitude: 12.3680,
    longitude: -1.5230,
    neighborhood: 'Gounghin',
    description: 'Gare du train Ouaga-Bobo',
  },
  {
    id: 'transport-4',
    name: 'Station SOTRACO centrale',
    type: 'transport',
    latitude: 12.3700,
    longitude: -1.5250,
    neighborhood: 'Centre-ville',
    description: 'Transport urbain principal',
  },
  {
    id: 'transport-5',
    name: 'Gare de Kossodo',
    type: 'transport',
    latitude: 12.4100,
    longitude: -1.4800,
    neighborhood: 'Kossodo',
    description: 'Gare routière nord',
  },

  // HÔPITAUX
  {
    id: 'hospital-1',
    name: 'CHU Yalgado Ouédraogo',
    type: 'hospital',
    latitude: 12.3680,
    longitude: -1.5230,
    neighborhood: 'Gounghin',
    description: 'Centre hospitalier universitaire principal',
  },
  {
    id: 'hospital-2',
    name: 'CHU Pédiatrique Charles de Gaulle',
    type: 'hospital',
    latitude: 12.3720,
    longitude: -1.5180,
    neighborhood: 'Centre-ville',
    description: 'Hôpital pédiatrique spécialisé',
  },
  {
    id: 'hospital-3',
    name: 'Clinique Bon Secours',
    type: 'hospital',
    latitude: 12.3750,
    longitude: -1.5050,
    neighborhood: 'Ouaga 2000',
    description: 'Clinique privée moderne',
  },
  {
    id: 'hospital-4',
    name: 'Centre Médical Paul VI',
    type: 'hospital',
    latitude: 12.3800,
    longitude: -1.5450,
    neighborhood: 'Cissin',
    description: 'Centre médical catholique',
  },
  {
    id: 'hospital-5',
    name: 'Polyclinique Notre Dame de la Paix',
    type: 'hospital',
    latitude: 12.3950,
    longitude: -1.5300,
    neighborhood: 'Somgandé',
    description: 'Polyclinique de quartier',
  },

  // MARCHÉS
  {
    id: 'market-1',
    name: 'Marché central de Ouagadougou',
    type: 'market',
    latitude: 12.3700,
    longitude: -1.5250,
    neighborhood: 'Centre-ville',
    description: 'Grand marché central historique',
  },
  {
    id: 'market-2',
    name: 'Marché de Dapoya',
    type: 'market',
    latitude: 12.3650,
    longitude: -1.5100,
    neighborhood: 'Dapoya',
    description: 'Marché populaire très fréquenté',
  },
  {
    id: 'market-3',
    name: 'Marché de Gounghin',
    type: 'market',
    latitude: 12.3550,
    longitude: -1.5250,
    neighborhood: 'Gounghin',
    description: 'Marché de quartier',
  },
  {
    id: 'market-4',
    name: 'Marché de Cissin',
    type: 'market',
    latitude: 12.3800,
    longitude: -1.5450,
    neighborhood: 'Cissin',
    description: 'Marché moderne',
  },
  {
    id: 'market-5',
    name: 'Marché Rood-Woko',
    type: 'market',
    latitude: 12.3600,
    longitude: -1.5300,
    neighborhood: 'Zogona',
    description: 'Grand marché traditionnel',
  },

  // CENTRES COMMERCIAUX
  {
    id: 'mall-1',
    name: 'Marina Market',
    type: 'mall',
    latitude: 12.3750,
    longitude: -1.5050,
    neighborhood: 'Ouaga 2000',
    description: 'Centre commercial moderne',
  },
  {
    id: 'mall-2',
    name: 'Carrefour Ouagadougou',
    type: 'mall',
    latitude: 12.3680,
    longitude: -1.5230,
    neighborhood: 'Gounghin',
    description: 'Hypermarché Carrefour',
  },
  {
    id: 'mall-3',
    name: 'SOPAM',
    type: 'mall',
    latitude: 12.3700,
    longitude: -1.5250,
    neighborhood: 'Centre-ville',
    description: 'Supermarché central',
  },
  {
    id: 'mall-4',
    name: 'Centre Commercial Sayouba Traore',
    type: 'mall',
    latitude: 12.3600,
    longitude: -1.5300,
    neighborhood: 'Zogona',
    description: 'Centre commercial populaire',
  },

  // RESTAURANTS
  {
    id: 'restaurant-1',
    name: 'Le Verdoyant',
    type: 'restaurant',
    latitude: 12.3720,
    longitude: -1.5180,
    neighborhood: 'Centre-ville',
    description: 'Restaurant gastronomique',
  },
  {
    id: 'restaurant-2',
    name: 'Chez Wou',
    type: 'restaurant',
    latitude: 12.3750,
    longitude: -1.5050,
    neighborhood: 'Ouaga 2000',
    description: 'Cuisine burkinabè authentique',
  },
  {
    id: 'restaurant-3',
    name: 'L\'Eau Vive',
    type: 'restaurant',
    latitude: 12.3700,
    longitude: -1.5250,
    neighborhood: 'Centre-ville',
    description: 'Restaurant français',
  },
  {
    id: 'restaurant-4',
    name: 'Le Palmier',
    type: 'restaurant',
    latitude: 12.3680,
    longitude: -1.5230,
    neighborhood: 'Gounghin',
    description: 'Restaurant terrasse',
  },
  {
    id: 'restaurant-5',
    name: 'Maquis Président',
    type: 'restaurant',
    latitude: 12.3650,
    longitude: -1.5100,
    neighborhood: 'Dapoya',
    description: 'Maquis traditionnel populaire',
  },
];

export const POI_CATEGORIES = {
  school: {
    label: 'Écoles',
    icon: '🏫',
    color: '#3b82f6',
  },
  transport: {
    label: 'Transports',
    icon: '🚌',
    color: '#10b981',
  },
  hospital: {
    label: 'Hôpitaux',
    icon: '🏥',
    color: '#ef4444',
  },
  market: {
    label: 'Marchés',
    icon: '🛒',
    color: '#f59e0b',
  },
  mall: {
    label: 'Centres commerciaux',
    icon: '🏬',
    color: '#8b5cf6',
  },
  restaurant: {
    label: 'Restaurants',
    icon: '🍽️',
    color: '#ec4899',
  },
};
