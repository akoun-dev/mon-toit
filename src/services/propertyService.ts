import { supabase } from '@/integrations/supabase/client';
import type { Property, SearchFilters } from '@/types';
import { logger } from '@/services/logger';

/**
 * Helper to determine if a property should be shown to a user
 */
export const shouldShowProperty = (property: Property, currentUserId?: string): boolean => {
  // ALWAYS show to property owner
  if (currentUserId && property.owner_id === currentUserId) {
    return true;
  }
  // Hide rented properties from everyone else
  return property.status !== 'loué';
};

/**
 * Parse Supabase/Postgres errors into user-friendly messages
 */
export function parsePropertyError(error: any): string {
  if (!error) return 'Une erreur inconnue est survenue';

  const errorMessage = error?.message || String(error);
  const errorCode = error?.code;

  // Postgres constraint violations
  if (errorCode === '23505') {
    return 'Une propriété similaire existe déjà. Vérifiez vos données.';
  }
  
  if (errorCode === '23503') {
    return 'Référence invalide. Assurez-vous que toutes les informations sont correctes.';
  }

  if (errorCode === '23502') {
    return 'Champs obligatoires manquants. Veuillez remplir tous les champs requis.';
  }

  // RLS policy violations
  if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
    return 'Permissions insuffisantes. Connectez-vous avec un compte propriétaire.';
  }

  // Geolocation errors
  if (errorMessage.includes('latitude') || errorMessage.includes('longitude')) {
    return 'Erreur de localisation. Veuillez sélectionner un emplacement valide sur la carte.';
  }

  // Network/timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
  }

  // Generic validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('invalide')) {
    return 'Données invalides. Vérifiez que tous les champs sont correctement remplis.';
  }

  // Return original message if no pattern matches
  return errorMessage.length > 100 
    ? 'Erreur lors de la création de la propriété. Veuillez réessayer.' 
    : errorMessage;
}

/**
 * Centralized property service for all property-related database operations
 */
export const propertyService = {
  /**
   * Fetch all properties with optional filters
   * Uses secure RPC to hide owner_id from public queries
   */
  async fetchAll(filters?: SearchFilters): Promise<Property[]> {
    // 🔍 PHASE 1: DIAGNOSTIC - Log des filtres appliqués
    console.log('🔍 [PropertyService] fetchAll appelé avec filtres:', filters);
    
    // SECURITY: Use RPC for public property browsing (hides owner_id)
    // For ANSUT certified properties, still use direct query with join
    if (filters?.isAnsutCertified) {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          leases!inner(certification_status)
        `)
        .eq('leases.certification_status', 'certified')
        .order('created_at', { ascending: false });

      if (error) {
        logger.logError(error, { context: 'propertyService', action: 'fetchCertifiedProperties' });
        throw error;
      }
      
      // Remove duplicates if multiple certified leases for the same property
      const uniqueProperties = data.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as any[]);

      console.log(`✅ [PropertyService] ${uniqueProperties.length} propriétés certifiées ANSUT trouvées`);
      return uniqueProperties as Property[];
    }

    // Use secure RPC for public browsing - exclude rented properties
    const { data, error } = await supabase.rpc('get_public_properties', {
      p_city: filters?.city || null,
      p_property_type: filters?.propertyType?.[0] || null,
      p_min_rent: filters?.minPrice || null,
      p_max_rent: filters?.maxPrice || null,
      p_min_bedrooms: filters?.minBedrooms || null,
      p_status: null, // RPC handles filtering
    });

    if (error) {
      logger.logError(error, { context: 'propertyService', action: 'fetchAllProperties' });
      console.error('❌ [PropertyService] Erreur API:', error);

      // Provide more context in error message
      const enhancedError = new Error(
        `Failed to fetch properties: ${error.message || 'Unknown error'}. ${
          error.code ? `Error code: ${error.code}` : ''
        }`
      );
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }

    console.log(`📊 [PropertyService] ${data?.length || 0} propriétés reçues de l'API`);

    // Apply client-side filters not supported by RPC
    let results = data || [];
    
    // CRITICAL: Filter out rented properties from public view (unless user is owner)
    const { data: { user } } = await supabase.auth.getUser();
    const beforeFilter = results.length;
    results = results.filter(p => shouldShowProperty(p as any, user?.id));
    console.log(`🔒 [PropertyService] Filtrage "shouldShowProperty": ${beforeFilter} → ${results.length} propriétés`);
    
    if (filters?.propertyType && filters.propertyType.length > 1) {
      const before = results.length;
      results = results.filter(p => filters.propertyType?.includes(p.property_type));
      console.log(`🏠 [PropertyService] Filtre propertyType: ${before} → ${results.length}`);
    }
    if (filters?.minBathrooms) {
      const before = results.length;
      results = results.filter(p => p.bathrooms >= filters.minBathrooms!);
      console.log(`🚿 [PropertyService] Filtre minBathrooms: ${before} → ${results.length}`);
    }
    if (filters?.minSurface) {
      const before = results.length;
      results = results.filter(p => p.surface_area && p.surface_area >= filters.minSurface!);
      console.log(`📐 [PropertyService] Filtre minSurface: ${before} → ${results.length}`);
    }
    if (filters?.isFurnished !== undefined) {
      const before = results.length;
      results = results.filter(p => p.is_furnished === filters.isFurnished);
      console.log(`🛋️ [PropertyService] Filtre isFurnished: ${before} → ${results.length}`);
    }
    if (filters?.hasParking !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_parking === filters.hasParking);
      console.log(`🚗 [PropertyService] Filtre hasParking: ${before} → ${results.length}`);
    }
    if (filters?.hasGarden !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_garden === filters.hasGarden);
      console.log(`🌳 [PropertyService] Filtre hasGarden: ${before} → ${results.length}`);
    }
    if (filters?.hasAc !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_ac === filters.hasAc);
      console.log(`❄️ [PropertyService] Filtre hasAc: ${before} → ${results.length}`);
    }

    console.log(`✅ [PropertyService] RÉSULTAT FINAL: ${results.length} propriétés après tous les filtres`);

    // Note: owner_id is intentionally excluded by RPC for security
    return results as unknown as Property[];
  },

  /**
   * Fetch a single property by ID
   * SECURITY: If user is authenticated, try direct query first (allows owners to see pending properties)
   * Otherwise, use public RPC for approved properties
   */
  async fetchById(id: string): Promise<Property | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // If authenticated, try direct query first (RLS will grant access if user is owner/admin)
    if (user) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      // If success and data exists, return (owner can see their pending property)
      if (!error && data) {
        return data;
      }
    }
    
    // Otherwise, try public RPC (for approved properties)
    const { data: publicData, error: publicError } = await supabase.rpc('get_public_property', {
      p_property_id: id
    });

    if (!publicError && publicData && publicData.length > 0) {
      return publicData[0] as unknown as Property;
    }

    // No method found the property
    return null;
  },

  /**
   * Fetch properties by owner ID
   */
  async fetchByOwner(ownerId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.logError(error, { context: 'propertyService', action: 'fetchByOwner', ownerId });
      throw error;
    }

    return data || [];
  },

  /**
   * Update a property
   */
  async update(id: string, updates: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.logError(error, { context: 'propertyService', action: 'updateProperty', propertyId: id });
      const userMessage = parsePropertyError(error);
      throw new Error(userMessage);
    }

    return data;
  },

  /**
   * Delete a property
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      logger.logError(error, { context: 'propertyService', action: 'deleteProperty', propertyId: id });
      const userMessage = parsePropertyError(error);
      throw new Error(userMessage);
    }
  },

  /**
   * Increment view count for a property
   */
  async incrementViewCount(id: string): Promise<void> {
    // Manually increment view count
    const { data: property } = await supabase
      .from('properties')
      .select('view_count')
      .eq('id', id)
      .single();

    if (property) {
      const { error } = await supabase
        .from('properties')
        .update({ view_count: (property.view_count || 0) + 1 })
        .eq('id', id);

      if (error) {
        logger.logError(error, { context: 'propertyService', action: 'incrementViewCount', propertyId: id });
        throw error;
      }
    }
  },

  /**
   * Get property statistics
   */
  async getStats(propertyId: string) {
    const [favoritesResult, applicationsResult, propertyResult] = await Promise.all([
      supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId),
      supabase
        .from('rental_applications')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId),
      supabase
        .from('properties')
        .select('view_count')
        .eq('id', propertyId)
        .single(),
    ]);

    const views = propertyResult.data?.view_count || 0;
    const applications = applicationsResult.count || 0;

    return {
      views,
      favorites: favoritesResult.count || 0,
      applications,
      conversionRate: views > 0 ? Math.round((applications / views) * 100) : 0,
    };
  },

  /**
   * Search properties with geo-location filtering
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: SearchFilters
  ): Promise<Property[]> {
    // First fetch all properties with filters
    const properties = await this.fetchAll(filters);

    // Filter by distance (using Haversine formula in geo.ts)
    const { calculateDistance } = await import('@/lib/geo');

    return properties.filter((property) => {
      if (!property.latitude || !property.longitude) return false;

      const distance = calculateDistance(
        latitude,
        longitude,
        property.latitude,
        property.longitude
      );

      return distance <= radiusKm;
    });
  },
};
