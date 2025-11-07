export interface BurkinaCity {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number;
  description: string;
  icon: string;
}

export const BURKINA_CITIES: BurkinaCity[] = [
  {
    id: 'ouagadougou',
    name: 'Ouagadougou',
    region: 'Centre',
    latitude: 12.3714,
    longitude: -1.5197,
    population: 2500000,
    description: 'Capitale et plus grande ville du Burkina Faso',
    icon: '🏛️'
  },
  {
    id: 'bobo-dioulasso',
    name: 'Bobo-Dioulasso',
    region: 'Hauts-Bassins',
    latitude: 11.1833,
    longitude: -4.2981,
    population: 900000,
    description: 'Capitale économique et 2ème ville du pays',
    icon: '🏭'
  },
  {
    id: 'koudougou',
    name: 'Koudougou',
    region: 'Centre-Ouest',
    latitude: 12.2526,
    longitude: -2.3653,
    population: 160000,
    description: '3ème ville, centre culturel et artisanal',
    icon: '🎨'
  },
  {
    id: 'ouahigouya',
    name: 'Ouahigouya',
    region: 'Nord',
    latitude: 13.5828,
    longitude: -2.4208,
    population: 124000,
    description: 'Chef-lieu de la région du Nord',
    icon: '🌾'
  },
  {
    id: 'banfora',
    name: 'Banfora',
    region: 'Cascades',
    latitude: 10.6333,
    longitude: -4.7500,
    population: 93000,
    description: 'Ville touristique, proche des cascades de Karfiguéla',
    icon: '💧'
  },
  {
    id: 'fada-ngourma',
    name: 'Fada N\'Gourma',
    region: 'Est',
    latitude: 12.0614,
    longitude: 0.3583,
    population: 65000,
    description: 'Chef-lieu de la région de l\'Est',
    icon: '🌅'
  },
  {
    id: 'dori',
    name: 'Dori',
    region: 'Sahel',
    latitude: 14.0347,
    longitude: -0.0353,
    population: 46000,
    description: 'Capitale du Sahel, porte du désert',
    icon: '🏜️'
  },
  {
    id: 'tenkodogo',
    name: 'Tenkodogo',
    region: 'Centre-Est',
    latitude: 11.7800,
    longitude: -0.3700,
    population: 61000,
    description: 'Chef-lieu du Centre-Est',
    icon: '🌳'
  }
];

// Centre géographique du Burkina Faso pour la vue initiale
export const BURKINA_CENTER = {
  latitude: 12.2383,
  longitude: -1.5616,
  zoom: 7
};
