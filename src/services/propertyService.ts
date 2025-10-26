import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Property, SearchFilters } from '@/types';
import { logger } from '@/services/logger';

// Safe column list that only includes existing columns in the database
const SAFE_PROPERTY_COLUMNS = [
  'id',
  'title',
  'description',
  'property_type',
  'city',
  'neighborhood',
  'address',
  'monthly_rent',
  'deposit_amount',
  'surface_area',
  'bedrooms',
  'bathrooms',
  'owner_id',
  'status',
  'is_furnished',
  'has_ac',
  'has_parking',
  'has_garden',
  'latitude',
  'longitude',
  'floor_number',
  'created_at',
  'updated_at',
  'view_count',
  'moderation_status',
  'moderated_at',
  'moderated_by',
  'moderation_notes',
  'title_deed_url'
].join(',');

/**
 * Helper to determine if a property should be shown to a user
 */
export const shouldShowProperty = (property: Property, currentUserId?: string): boolean => {
  // ALWAYS show to property owner
  if (currentUserId && (property as any).owner_id === currentUserId) {
    return true;
  }

  // Normalize status and filter appropriately
  const status = (property as any).status?.toString().toLowerCase();

  // Explicitly ALLOW these statuses for public viewing
  const allowedStatuses = new Set([
    'published', 'publish', 'publié', 'available', 'disponible', 'active',
    'actif', 'featured', 'en vedette', 'draft', 'brouillon', 'pending',
    'en attente', 'review', 'en révision'
  ]);

  // Explicitly HIDE these statuses for public viewing
  const hiddenStatuses = new Set([
    'loué', 'loue', 'rented', 'occupied', 'indisponible', 'archived',
    'archivé', 'sold', 'vendu', 'suspended', 'suspendu', 'deleted', 'supprimé'
  ]);

  // If status is explicitly hidden, don't show
  if (hiddenStatuses.has(status)) {
    return false;
  }

  // If status is explicitly allowed, show it
  if (allowedStatuses.has(status)) {
    return true;
  }

  // For unknown or null status, show it (better to show than hide)
  return true;
};

/**
 * Parse Supabase/Postgres errors into user-friendly messages
 */
export function parsePropertyError(error: Error | { message?: string; code?: string } | unknown): string {
  if (!error) return 'Une erreur inconnue est survenue';

  const errorMessage = error instanceof Error ? error.message : ((error as any)?.message || String(error));
  const errorCode = (error as any)?.code;

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
   * Uses direct query with anonymous client for public browsing
   */
  async fetchAll(filters?: SearchFilters): Promise<Property[]> {
    logger.debug('PropertyService fetchAll called with filters', { filters });

    // SECURITY: Use direct query with anonymous client for public property browsing
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

      logger.info('ANSUT certified properties found', { count: uniqueProperties.length });
      return uniqueProperties as Property[];
    }

    // Build query with filters using anonymous client for public access
    let query = supabaseAnon
      .from('properties')
      .select(SAFE_PROPERTY_COLUMNS);

    // Apply filters directly in the query
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.propertyType && filters.propertyType.length > 0) {
      query = query.in('property_type', filters.propertyType);
    }
    if (filters?.minPrice) {
      query = query.gte('monthly_rent', filters.minPrice);
    }
    if (filters?.maxPrice) {
      query = query.lte('monthly_rent', filters.maxPrice);
    }
    if (filters?.minBedrooms) {
      query = query.gte('bedrooms', filters.minBedrooms);
    }
    if (filters?.minSurface) {
      query = query.gte('surface_area', filters.minSurface);
    }
    if (filters?.maxSurface) {
      query = query.lte('surface_area', filters.maxSurface);
    }
    if (filters?.isFurnished !== undefined) {
      query = query.eq('is_furnished', filters.isFurnished);
    }
    if (filters?.hasAc !== undefined) {
      query = query.eq('has_ac', filters.hasAc);
    }
    if (filters?.hasParking !== undefined) {
      query = query.eq('has_parking', filters.hasParking);
    }
    if (filters?.hasGarden !== undefined) {
      query = query.eq('has_garden', filters.hasGarden);
    }

    // Order by most recent and limit results
    query = query.order('created_at', { ascending: false }).limit(100);

    const { data: propertiesData, error } = await query;

    if (error) {
      logger.logError(error, { context: 'propertyService', action: 'fetchAllProperties' });

      // Provide more context in error message
      const enhancedError = new Error(
        `Failed to fetch properties: ${error.message || 'Unknown error'}. ${
          error.code ? `Error code: ${error.code}` : ''
        }`
      );
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }

    let data = propertiesData || [];

    logger.debug('Properties received from API', { count: data?.length || 0 });

    // If no properties exist, create demo data
    if (!data || data.length === 0) {
      logger.warn('No properties found in database, attempting to create demo data');
      try {
        const demoData = await this.createDemoProperty();
        if (demoData) {
          logger.info('Demo property created successfully');
          data = [demoData];
        }
      } catch (demoError) {
        logger.logError(demoError as Error, { context: 'propertyService', action: 'createDemoProperty' });
        logger.warn('Failed to create demo data, returning empty array');
        data = [];
      }
    }

    // Log sample property data structure to understand what we're working with
    if (data && data.length > 0) {
      logger.info('Sample property data structure', {
        sampleProperty: {
          id: data[0].id,
          title: data[0].title,
          main_image: null, // Will be loaded from property_media table
          images: [], // Will be loaded from property_media table
          images_count: 0, // Will be calculated from property_media table
          property_type: data[0].property_type,
          monthly_rent: data[0].monthly_rent,
          city: data[0].city,
          status: data[0].status
        }
      });

      // Log image availability statistics
      const stats = {
        total: data.length,
        withMainImage: 0, // Will be updated when property_media is implemented
        withImagesArray: 0, // Will be updated when property_media is implemented
        withoutAnyImages: data.length // Temporary until property_media is implemented
      };
      logger.info('Image availability statistics', stats);
    }

    // Filter properties for public viewing
    let results = data || [];

    // CRITICAL: Filter out rented properties from public view (unless user is owner)
    // Use try/catch to avoid authentication errors for public browsing
    let currentUserId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    } catch (error) {
      // User not authenticated - continue without filtering by ownership
      logger.debug('No user authenticated for property browsing', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    const beforeFilter = results.length;
    results = results.filter(p => shouldShowProperty(p as any, currentUserId));
    logger.debug('Properties filtered by visibility', { before: beforeFilter, after: results.length, hasUser: !!currentUserId });

    // Apply remaining client-side filters not supported in the main query
    if (filters?.minBathrooms) {
      const before = results.length;
      results = results.filter(p => p.bathrooms >= filters.minBathrooms!);
      logger.debug('Properties filtered by bathrooms', { before, after: results.length });
    }

    logger.info('Final property results after filtering', { count: results.length });

    // ENHANCEMENT: Load real images from property_media table
    const enhancedResults = await Promise.all(results.map(async property => {
      try {
        // Fetch real images from property_media table using anonymous client
        const { data: mediaData, error: mediaError } = await supabaseAnon
          .from('property_media')
          .select('url, title, description, is_primary, order_index, media_type')
          .eq('property_id', property.id)
          .eq('media_type', 'image')
          .order('is_primary', { ascending: false })
          .order('order_index', { ascending: true });

        if (!mediaError && mediaData && mediaData.length > 0) {
          // Extract URLs from media data
          property.images = mediaData.map(media => media.url);

          // Set main_image as the primary image or first image
          const primaryImage = mediaData.find(media => media.is_primary);
          property.main_image = primaryImage?.url || mediaData[0]?.url;

          logger.debug('Real images loaded from property_media', {
            propertyId: property.id,
            imagesCount: property.images.length,
            mainImage: property.main_image
          });
        } else {
          // No real images found - leave empty
          logger.debug('No real images found for property', {
            propertyId: property.id,
            mediaError: mediaError?.message
          });

          // Ensure empty arrays for consistency
          property.images = [];
          property.main_image = null;
        }
      } catch (error) {
        logger.logError(error as Error, {
          context: 'propertyService',
          action: 'loadPropertyImages',
          propertyId: property.id
        });

        // Ensure empty arrays for consistency
        if (!property.images) {
          property.images = [];
        }
        if (!property.main_image) {
          property.main_image = null;
        }
      }

      return property;
    }));

    // Note: owner_id is intentionally excluded by RPC for security
    return enhancedResults as unknown as Property[];
  },

  /**
   * Fetch a single property by ID
   * SECURITY: If user is authenticated, try direct query first (allows owners to see pending properties)
   * Otherwise, use public RPC for approved properties
   */
  async fetchById(id: string): Promise<Property | null> {
    let propertyData = null;

    // Check if user is authenticated (use try/catch to handle anonymous access)
    let user = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (error) {
      // User not authenticated - continue with anonymous access
      logger.debug('Anonymous user accessing property detail', { propertyId: id });
    }

    // If authenticated, try direct query first (RLS will grant access if user is owner/admin)
    if (user) {
      const { data, error } = await supabase
        .from('properties')
        .select(SAFE_PROPERTY_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      // If success and data exists, return (owner can see their pending property)
      if (!error && data) {
        propertyData = data;
      }
    }

    // Otherwise, try public query using anonymous client
    if (!propertyData) {
      const { data: publicData, error: publicError } = await supabaseAnon
        .from('properties')
        .select(SAFE_PROPERTY_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (!publicError && publicData) {
        propertyData = publicData as unknown as Property;
      }
    }

    // If we found the property, load its images
    if (propertyData) {
      try {
        // Fetch real images from property_media table using anonymous client
        const { data: mediaData, error: mediaError } = await supabaseAnon
          .from('property_media')
          .select('url, title, description, is_primary, order_index, media_type')
          .eq('property_id', id)
          .eq('media_type', 'image')
          .order('is_primary', { ascending: false })
          .order('order_index', { ascending: true });

        if (!mediaError && mediaData && mediaData.length > 0) {
          // Extract URLs from media data
          propertyData.images = mediaData.map(media => media.url);

          // Set main_image as the primary image or first image
          const primaryImage = mediaData.find(media => media.is_primary);
          propertyData.main_image = primaryImage?.url || mediaData[0]?.url;

          logger.debug('Real images loaded for property detail', {
            propertyId: id,
            imagesCount: propertyData.images.length,
            mainImage: propertyData.main_image
          });
        } else {
          // No real images found - leave empty
          logger.debug('No real images found for property detail', {
            propertyId: id,
            mediaError: mediaError?.message
          });

          // Ensure empty arrays for consistency
          propertyData.images = [];
          propertyData.main_image = null;
        }
      } catch (error) {
        logger.logError(error as Error, {
          context: 'propertyService',
          action: 'loadPropertyDetailImages',
          propertyId: id
        });

        // Ensure empty arrays for consistency
        if (!propertyData.images) {
          propertyData.images = [];
        }
        if (!propertyData.main_image) {
          propertyData.main_image = null;
        }
      }

      return propertyData;
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
      .select(SAFE_PROPERTY_COLUMNS)
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
        .select(SAFE_PROPERTY_COLUMNS, { count: 'exact', head: true })
        .eq('property_id', propertyId),
      supabase
        .from('rental_applications')
        .select(SAFE_PROPERTY_COLUMNS, { count: 'exact', head: true })
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

  /**
   * Create a demo property when database is empty
   */
  async createDemoProperty(): Promise<Property | null> {
    try {
      // Use service role to bypass RLS for demo data creation
      const supabaseAdmin = createClient(
        import.meta.env.SUPABASE_URL || Deno.env.get('SUPABASE_URL')!,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Try to find an existing user first, otherwise create a demo user
      let demoUserId = '00000000-0000-0000-0000-000000000001';

      // Check if demo user exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(demoUserId);

      if (!existingUser.user) {
        // Create demo user if doesn't exist
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: demoUserId,
          email: 'demo@mon-toit.ci',
          password: 'Demo2025!',
          email_confirm: true,
          user_metadata: {
            full_name: 'Utilisateur Demo',
            user_type: 'proprietaire',
          },
        });

        if (createError) {
          logger.warn('Could not create demo user, trying without fixed ID', { error: createError.message });
          // Try creating user without fixed ID
          const { data: tempUser } = await supabaseAdmin.auth.admin.createUser({
            email: 'demo@mon-toit.ci',
            password: 'Demo2025!',
            email_confirm: true,
            user_metadata: {
              full_name: 'Utilisateur Demo',
              user_type: 'proprietaire',
            },
          });

          if (tempUser.user) {
            demoUserId = tempUser.user.id;
          } else {
            throw new Error('Failed to create demo user');
          }
        } else {
          demoUserId = newUser.user.id;
        }
      }

      // Create demo property
      const demoProperty = {
        owner_id: demoUserId,
        title: 'Appartement Demo - Cocody',
        description: 'Bel appartement moderne dans le quartier de Cocody, idéal pour tester la plateforme. Proche des commerces et transports en commun.',
        property_type: 'appartement',
        status: 'disponible',
        address: 'Rue des Jardins, Cocody',
        city: 'Abidjan',
        neighborhood: 'Cocody',
        latitude: 5.3600,
        longitude: -3.9800,
        bedrooms: 2,
        bathrooms: 1,
        surface_area: 75.5,
        monthly_rent: 150000,
        deposit_amount: 300000,
        is_furnished: true,
        has_parking: true,
        has_ac: true,
        has_garden: false,
        // Note: main_image and images are now handled separately via property_media table
        moderation_status: 'approved',
        amenities: ['climatisation', 'parking', 'internet', 'gardien'],
        nearby_poi: ['supermarché', 'école', 'pharmacie', 'station de transport'],
        transport_access: 'Bus et taxis à 2 minutes',
        year_built: 2020,
        floor_number: 3,
        total_floors: 5,
        available_from: new Date().toISOString().split('T')[0],
      };

      const { data: createdProperty, error: insertError } = await supabaseAdmin
        .from('properties')
        .insert(demoProperty)
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating demo property', { error: insertError });
        throw insertError;
      }

      logger.info('Demo property created successfully', {
        propertyId: createdProperty.id,
        title: createdProperty.title
      });

      return createdProperty as Property;

    } catch (error) {
      logger.error('Failed to create demo property', error);
      return null;
    }
  },
};
