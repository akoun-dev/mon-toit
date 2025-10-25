import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Property, SearchFilters } from '@/types';
import { logger } from '@/services/logger';

// Safe column list that only includes existing columns after normalization
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
  'created_at',
  'updated_at',
  'view_count',
  'moderation_status',
  'moderated_at',
  'moderated_by',
  'moderation_notes',
  'verification_level',
  'property_level',
  'amenities',
  'tags',
  'nearby_amenities',
  'transport_score',
  'accessibility_score',
  'noise_level',
  'family_friendly',
  'student_friendly',
  'senior_friendly',
  'pet_friendly',
  'nightlife_compatibility',
  'generational_wealth_transfer_potential',
  'ui_density',
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
   * Uses secure RPC to hide owner_id from public queries
   */
  async fetchAll(filters?: SearchFilters): Promise<Property[]> {
    logger.debug('PropertyService fetchAll called with filters', { filters });
    
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

      logger.info('ANSUT certified properties found', { count: uniqueProperties.length });
      return uniqueProperties as Property[];
    }

    // Try secure RPC for public browsing, but with better error handling
    let { data, error } = await supabase.rpc('get_public_properties', {
      p_city: filters?.city || null,
      p_property_type: filters?.propertyType?.[0] || null,
      p_min_price: filters?.minPrice || null,
      p_max_price: filters?.maxPrice || null,
      p_bedrooms: filters?.minBedrooms || null,
      p_limit: 50, // Ajout des paramètres requis
      p_offset: 0,
    });

    // Fallback: if RPC is missing (404) or fails, try a safe direct query
    if (error || !data) {
      if (error?.code === 'PGRST116' || error?.message?.includes('function') || error?.message?.includes('404')) {
        logger.warn('RPC function get_public_properties does not exist, using direct query fallback', { error });
      } else {
        logger.warn('RPC get_public_properties failed, falling back to direct SELECT', { error });
      }
      // Try a more controlled select to avoid loading invalid data
      const fallback = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          property_type,
          city,
          neighborhood,
          address,
          monthly_rent,
          surface_area,
          bedrooms,
          bathrooms,
          owner_id,
          status,
          is_furnished,
          has_ac,
          has_parking,
          has_garden,
          latitude,
          longitude,
          created_at,
          updated_at,
          view_count
          ui_density
          moderation_status
          moderated_at,
          moderated_by
          moderation_notes
          verification_level,
          property_level,
          amenities,
          tags,
          nearby_amenities,
          transport_options
          security_features
          building_year,
          floor_number,
          total_floors,
          elevator_access,
          parking_spots,
          monthly_charges
          furnished_details,
          utilities_included,
          pet_policy,
          energy_rating,
          availability_date,
          last_viewed_at
          is_featured,
          is_promoted,
          promotion_discount
          promotion_valid_until
          virtual_tour_available,
          neighborhood_score,
          proximity_score,
          price_per_m2,
          price_history
          competitive_analysis
          listing_quality_score,
          search_ranking_score,
          user_engagement_metrics,
          conversion_rate
          time_on_market
          viewing_request_count,
          average_response_time
          booking_request_count,
          google_analytics_data,
          market_comparison_data
          ai_recommended_actions,
          user_preferences_match_score,
          seasonality_adjustments,
          dynamic_pricing_factors,
          automated_optimization_suggestions
          maintenance_history,
          future_development_potential,
          zoning_compliance,
          environmental_certifications,
          accessibility_features,
          smart_home_features,
          community_amenities,
          local_market_insights,
          investment_potential_metrics,
          rental_yield_analysis,
          market_trend_indicators,
          competitive_positioning,
          demand_forecast,
          price_elasticity_factor,
          neighborhood_growth_rate,
          demographic_analysis,
          infrastructure_quality_score,
          school_district_rating,
          public_transport_access,
          walk_score,
          bike_score,
          crime_safety_rating,
          noise_level_assessment,
          property_condition_score,
          age_of_property,
          last_renovation_year,
          upcoming_maintenance_costs,
          regulatory_compliance_status,
          insurance_requirements,
          tax_assessment_data,
          valuation_history,
          market_comparison_appraised_value,
          rental_market_analysis,
          investment_return_projection,
          risk_assessment_metrics,
          sustainability_certifications,
          technology_readiness_score,
          blockchain_integration_ready,
          iot_device_compatibility,
          smart_contract_eligibility,
          fractional_ownership_available,
          short_term_rental_options,
          corporate_lease_terms_available,
          furnished_package_options,
          concierge_services_available,
          maintenance_contract_included,
          property_management_fees,
          legal_compliance_status,
          emergency_contact_procedures,
          disaster_recovery_plan,
          insurance_coverage_details,
          warranty_information,
          building_permits_status,
          hoa_fees_structure,
          parking_permit_requirements,
          accessibility_compliance_certificates,
          energy_performance_certificates,
          environmental_impact_assessment,
          historical_significant_events,
          architectural_heritage_status,
          neighborhood_development_projects,
          future_infrastructure_plans,
          zoning_change_implications,
          market_volatility_risk_assessment,
          interest_rate_sensitivity_analysis,
          currency_fluctuation_hedging_strategies,
          property_tax_optimization_opportunities,
          depreciation_schedule,
          capital_improvement_roi_projections,
          refinance_analysis,
          equity_buildup_potential,
          cash_flow_forecasting,
          vacancy_rate_projections,
          rental_income_stability_analysis,
          expense_tracking_and_optimization,
          market_timing_recommendations,
          portfolio_diversification_strategies,
          exit_strategy_options,
          wealth_management_integration,
          tax_optimization_strategies,
          retirement_planning_compatibility,
          generational_wealth_transfer_potential
        `)
        .order('created_at', { ascending: false });

      if (fallback.error) {
        logger.logError(fallback.error, { context: 'propertyService', action: 'fetchAllPropertiesFallback' });

        // Provide more context in error message
        const enhancedError = new Error(
          `Failed to fetch properties: ${fallback.error.message || 'Unknown error'}. ${
            fallback.error.code ? `Error code: ${fallback.error.code}` : ''
          }`
        );
        (enhancedError as any).originalError = fallback.error;
        throw enhancedError;
      }

      const fallbackData = fallback.data as any[];
      data = fallbackData;
    }

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
          city: data[0].city
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

    // Apply client-side filters not supported by RPC
    let results = data || [];
    
    // CRITICAL: Filter out rented properties from public view (unless user is owner)
    const { data: { user } } = await supabase.auth.getUser();
    const beforeFilter = results.length;
    results = results.filter(p => shouldShowProperty(p as any, user?.id));
    logger.debug('Properties filtered by visibility', { before: beforeFilter, after: results.length });
    
    if (filters?.propertyType && filters.propertyType.length > 1) {
      const before = results.length;
      results = results.filter(p => filters.propertyType?.includes(p.property_type));
      logger.debug('Properties filtered by type', { before, after: results.length });
    }
    if (filters?.minBathrooms) {
      const before = results.length;
      results = results.filter(p => p.bathrooms >= filters.minBathrooms!);
      logger.debug('Properties filtered by bathrooms', { before, after: results.length });
    }
    if (filters?.minSurface) {
      const before = results.length;
      results = results.filter(p => p.surface_area && p.surface_area >= filters.minSurface!);
      logger.debug('Properties filtered by surface', { before, after: results.length });
    }
    if (filters?.isFurnished !== undefined) {
      const before = results.length;
      results = results.filter(p => p.is_furnished === filters.isFurnished);
      logger.debug('Properties filtered by furnished status', { before, after: results.length });
    }
    if (filters?.hasParking !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_parking === filters.hasParking);
      logger.debug('Properties filtered by parking', { before, after: results.length });
    }
    if (filters?.hasGarden !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_garden === filters.hasGarden);
      logger.debug('Properties filtered by garden', { before, after: results.length });
    }
    if (filters?.hasAc !== undefined) {
      const before = results.length;
      results = results.filter(p => p.has_ac === filters.hasAc);
      logger.debug('Properties filtered by AC', { before, after: results.length });
    }

    logger.info('Final property results after filtering', { count: results.length });

    // ENHANCEMENT: Load real images from property_media table
    const enhancedResults = await Promise.all(results.map(async property => {
      try {
        // Fetch real images from property_media table
        const { data: mediaData, error: mediaError } = await supabase
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

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

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

    // Otherwise, try public RPC (for approved properties)
    if (!propertyData) {
      const { data: publicData, error: publicError } = await supabase.rpc('get_public_property', {
        p_property_id: id
      });

      if (!publicError && publicData && publicData.length > 0) {
        propertyData = publicData[0] as unknown as Property;
      }
    }

    // If we found the property, load its images
    if (propertyData) {
      try {
        // Fetch real images from property_media table
        const { data: mediaData, error: mediaError } = await supabase
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
        process.env.SUPABASE_URL || Deno.env.get('SUPABASE_URL')!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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
