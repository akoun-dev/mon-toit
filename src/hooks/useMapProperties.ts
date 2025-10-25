import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

export interface MapProperty {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  monthly_rent: number;
  latitude: number;
  longitude: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  surface_area: number;
  status: string;
}

interface UseMapPropertiesOptions {
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    minBedrooms?: number;
    maxBedrooms?: number;
    amenities?: string[];
  };
  refetchInterval?: number;
}

export const useMapProperties = (options: UseMapPropertiesOptions = {}) => {
  const { filters, refetchInterval = 30000 } = options;

  return useQuery({
    queryKey: ['map-properties', filters],
    queryFn: async () => {
      try {
        console.log('🗺️ useMapProperties - Trying RPC with filters:', filters);

        // Try RPC function first as it's more reliable
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_properties', {
          p_limit: 100,
          p_offset: 0,
          p_city: filters?.city || null,
          p_min_price: filters?.minPrice || null,
          p_max_price: filters?.maxPrice || null,
          p_property_type: filters?.propertyType || null,
          p_bedrooms: filters?.minBedrooms || null,
          p_search: null,
        });

        console.log('🗺️ useMapProperties - RPC result:', {
          count: rpcData?.length || 0,
          error: rpcError,
          sampleData: rpcData?.slice(0, 3)
        });

        if (!rpcError && rpcData) {
          return rpcData as MapProperty[];
        }

        // Fallback to direct query with better error handling
        let query = supabase
          .from('properties')
          .select(`
            id,
            title,
            city,
            neighborhood,
            monthly_rent,
            latitude,
            longitude,
            property_type,
            bedrooms,
            bathrooms,
            surface_area,
            status
          `)
          .eq('status', 'disponible')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        // Apply filters
        if (filters?.minPrice) {
          query = query.gte('monthly_rent', filters.minPrice);
        }
        if (filters?.maxPrice) {
          query = query.lte('monthly_rent', filters.maxPrice);
        }
        if (filters?.propertyType) {
          query = query.eq('property_type', filters.propertyType);
        }
        if (filters?.minBedrooms) {
          query = query.gte('bedrooms', filters.minBedrooms);
        }
        if (filters?.maxBedrooms) {
          query = query.lte('bedrooms', filters.maxBedrooms);
        }

        const { data, error } = await query;

        console.log('🗺️ useMapProperties - Direct query result:', {
          count: data?.length || 0,
          error: error,
          sampleData: data?.slice(0, 3)
        });

        if (error) {
          logger.logError(error, { context: 'useMapProperties' });
          throw error;
        }

        // Note: amenities column removed from schema, skip filtering
        const filteredData = data || [];

        logger.info(`Loaded ${filteredData.length} properties for map`, {
          filters,
          count: filteredData.length,
          sampleProperties: filteredData.slice(0, 3).map(p => ({
            id: p.id,
            title: p.title,
            neighborhood: p.neighborhood,
            coordinates: `${p.latitude}, ${p.longitude}`
          }))
        });

        return filteredData as MapProperty[];
      } catch (error) {
        logger.logError(error, { context: 'useMapProperties' });
        return [];
      }
    },
    refetchInterval,
    staleTime: 20000, // Consider data stale after 20s
  });
};

// Hook pour les statistiques de la carte
export const useMapStats = (properties: MapProperty[]) => {
  const stats = {
    totalProperties: properties.length,
    avgPrice: properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + p.monthly_rent, 0) / properties.length)
      : 0,
    minPrice: properties.length > 0
      ? Math.min(...properties.map(p => p.monthly_rent))
      : 0,
    maxPrice: properties.length > 0
      ? Math.max(...properties.map(p => p.monthly_rent))
      : 0,
    neighborhoods: [...new Set(properties.map(p => p.neighborhood).filter(Boolean))].length,
    cities: [...new Set(properties.map(p => p.city))].length,
    propertyTypes: [...new Set(properties.map(p => p.property_type))].length,
  };

  return stats;
};

