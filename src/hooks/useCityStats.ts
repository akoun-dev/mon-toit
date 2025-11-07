import { useMemo } from 'react';
import { MapProperty } from './useMapProperties';
import { BurkinaCity } from '@/data/burkinaCities';

export interface CityStats {
  city: BurkinaCity;
  propertyCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  propertyTypes: Record<string, number>;
  totalValue: number;
}

export const useCityStats = (properties: MapProperty[], cities: BurkinaCity[]): CityStats[] => {
  return useMemo(() => {
    return cities.map(city => {
      const cityProperties = properties.filter(p => 
        p.city.toLowerCase().includes(city.name.toLowerCase()) ||
        city.name.toLowerCase().includes(p.city.toLowerCase())
      );

      const prices = cityProperties.map(p => p.monthly_rent);
      const propertyTypes = cityProperties.reduce((acc, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        city,
        propertyCount: cityProperties.length,
        avgPrice: prices.length > 0 
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        propertyTypes,
        totalValue: prices.reduce((a, b) => a + b, 0)
      };
    }).sort((a, b) => b.propertyCount - a.propertyCount);
  }, [properties, cities]);
};
