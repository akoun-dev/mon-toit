import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { handleCors, createCorsResponse, createErrorResponse } from '../shared/cors.ts'
import { requireAuth, createSupabaseClient, AuthUser } from '../shared/auth.ts'
import { validateRecommendationRequest } from '../shared/validation.ts'
import { getCachedData, CacheKeys, CacheTTL, invalidateUserCache } from '../shared/cache.ts'
import { createLogger, handleApiError, createSuccessResponse, ErrorCode, rateLimiters, checkRateLimit } from '../shared/errors.ts'

interface RecommendationRequest {
  userId: string
  type: 'properties' | 'areas' | 'users'
  propertyId?: string
  limit?: number
  preferences?: {
    budget?: {
      min?: number
      max?: number
    }
    areas?: string[]
    propertyTypes?: string[]
    features?: string[]
  }
}

serve(async (req) => {
  const logger = createLogger(req)
  
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    // Parse request body
    const body: RecommendationRequest = await req.json()
    const validation = validateRecommendationRequest(body)
    
    if (!validation.isValid) {
      logger.warn('Invalid request data', { errors: validation.errors })
      return createErrorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400
      )
    }

    // Authenticate user
    const authResult = await requireAuth(req)
    if (authResult.response) {
      return authResult.response
    }

    const user = authResult.user

    // Check rate limiting
    const rateLimitResult = checkRateLimit(user.id, rateLimiters.recommendations)
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { userId: user.id })
      return createCorsResponse(
        { success: false, error: rateLimitResult.error },
        429
      )
    }

    // Create cache key based on user and preferences
    const cacheKey = CacheKeys.propertyRecommendations(user.id, body.preferences)
    
    // Try to get from cache first
    const cachedData = await getCachedData(
      cacheKey,
      () => generateRecommendations(body, user, logger),
      CacheTTL.MEDIUM // 5 minutes cache for recommendations
    )

    logger.info('Recommendations generated successfully', {
      userId: user.id,
      type: body.type,
      preferences: body.preferences
    })

    return createCorsResponse(
      createSuccessResponse(cachedData, 'Recommendations generated successfully', {
        type: body.type,
        userId: user.id,
        generated_at: new Date().toISOString()
      })
    )

  } catch (error) {
    logger.error('Error in recommendations function', error)
    
    const apiError = handleApiError(error, logger)
    return createCorsResponse(
      { success: false, error: apiError },
      apiError.code === ErrorCode.INTERNAL_ERROR ? 500 : 400
    )
  }
})

async function generateRecommendations(
  request: RecommendationRequest,
  user: AuthUser,
  logger: any
): Promise<any[]> {
  const { userId, type, limit = 5, preferences = {} } = request
  const supabase = createSupabaseClient()

  try {
    let recommendations = []

    switch (type) {
      case 'properties':
        recommendations = await generatePropertyRecommendations(supabase, userId, preferences, limit, logger)
        break
      case 'areas':
        recommendations = await generateAreaRecommendations(supabase, userId, preferences, limit, logger)
        break
      case 'users':
        recommendations = await generateUserRecommendations(supabase, userId, preferences, limit, logger)
        break
      default:
        throw new Error('Invalid recommendation type')
    }

    return recommendations

  } catch (error) {
    logger.error('Error generating recommendations', error)
    throw error
  }
}

async function generatePropertyRecommendations(
  supabase: any, 
  userId: string, 
  preferences: any, 
  limit: number,
  logger: any
): Promise<any[]> {
  try {
    // Get user profile to understand preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, city')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile', profileError)
      throw profileError
    }

    // Get user favorites to understand preferences
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('property_id')
      .eq('user_id', userId)

    if (favoritesError) {
      logger.error('Error fetching user favorites', favoritesError)
      throw favoritesError
    }

    const favoritePropertyIds = favorites?.map((f: any) => f.property_id) || []

    // Build query with proper column names
    let query = supabase
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
        created_at,
        updated_at,
        profiles!owner_id_fkey(
          full_name,
          avatar_url,
          user_type
        )
      `)
      .eq('status', 'disponible')
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to filter from

    // Apply filters based on preferences
    if (preferences.budget?.min) {
      query = query.gte('monthly_rent', preferences.budget.min)
    }
    if (preferences.budget?.max) {
      query = query.lte('monthly_rent', preferences.budget.max)
    }
    if (preferences.areas && preferences.areas.length > 0) {
      query = query.in('city', preferences.areas)
    }
    if (preferences.propertyTypes && preferences.propertyTypes.length > 0) {
      query = query.in('property_type', preferences.propertyTypes)
    }

    // Exclude user's own properties and already favorited properties
    query = query.not('owner_id', userId)
    if (favoritePropertyIds.length > 0) {
      query = query.not('id', 'in', `(${favoritePropertyIds.join(',')})`)
    }

    const { data: properties, error: propertiesError } = await query

    if (propertiesError) {
      logger.error('Error fetching properties', propertiesError)
      throw propertiesError
    }

    if (!properties || properties.length === 0) {
      return []
    }

    // Score and rank properties
    const scoredProperties = properties.map((property: any) => {
      let score = 0

      // Base score for being available
      score += 10

      // Bonus for recent properties
      const daysSinceCreated = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 5
      else if (daysSinceCreated < 30) score += 3

      // Bonus for complete description
      if (property.description && property.description.length > 100) {
        score += 3
      }

      // Bonus for good surface area
      if (property.surface_area && property.surface_area > 50) {
        score += 2
      }

      // Match with user preferences
      if (profile?.city && property.city === profile.city) {
        score += 8
      }

      if (preferences.features) {
        const propertyFeatures = JSON.stringify(property.features || {}).toLowerCase()
        preferences.features.forEach((feature: string) => {
          if (propertyFeatures.includes(feature.toLowerCase())) {
            score += 2
          }
        })
      }

      return {
        ...property,
        recommendation_score: score,
        recommendation_reasons: generateRecommendationReasons(property, profile, preferences)
      }
    })

    // Sort by score and return top recommendations
    return scoredProperties
      .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit)

  } catch (error) {
    logger.error('Error generating property recommendations:', error)
    return []
  }
}

async function generateAreaRecommendations(
  supabase: any, 
  userId: string, 
  preferences: any, 
  limit: number,
  logger: any
): Promise<any[]> {
  try {
    // Get popular areas based on property density
    const { data: properties, error } = await supabase
      .from('properties')
      .select('city, monthly_rent, property_type')
      .eq('status', 'disponible')

    if (error) {
      logger.error('Error fetching properties for area recommendations', error)
      throw error
    }

    if (!properties || properties.length === 0) {
      return []
    }

    // Group by city and calculate metrics
    const areaStats: Record<string, any> = properties.reduce((acc: any, property: any) => {
      if (!acc[property.city]) {
        acc[property.city] = {
          name: property.city,
          count: 0,
          avgRent: 0,
          propertyTypes: new Set(),
          totalRent: 0
        }
      }

      acc[property.city].count++
      acc[property.city].totalRent += property.monthly_rent || 0
      acc[property.city].propertyTypes.add(property.property_type)

      return acc
    }, {})

    // Calculate average rents and prepare recommendations
    const recommendations = Object.values(areaStats)
      .map((area: any) => ({
        ...area,
        avgRent: Math.round(area.totalRent / area.count),
        propertyTypes: Array.from(area.propertyTypes)
      }))
      .filter((area: any) => area.count >= 2) // Only areas with multiple properties
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit)

    return recommendations

  } catch (error) {
    logger.error('Error generating area recommendations:', error)
    return []
  }
}

async function generateUserRecommendations(
  supabase: any, 
  userId: string, 
  preferences: any, 
  limit: number,
  logger: any
): Promise<any[]> {
  try {
    // Get user's profile to suggest similar users
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, city')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile for user recommendations', profileError)
      throw profileError
    }

    if (!userProfile) {
      return []
    }

    // Find users in same city or with similar interests
    let query = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_type, city, created_at')
      .neq('id', userId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(limit * 2)

    if (userProfile.city) {
      query = query.eq('city', userProfile.city)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      logger.error('Error fetching users for recommendations', usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      return []
    }

    // Score users based on similarity
    const scoredUsers = users.map((user: any) => {
      let score = 0

      // Same city bonus
      if (user.city === userProfile.city) {
        score += 10
      }

      // Same user type bonus
      if (user.user_type === userProfile.user_type) {
        score += 5
      }

      // Recent user bonus
      const daysSinceCreated = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 30) score += 3
      else if (daysSinceCreated < 90) score += 1

      return {
        ...user,
        recommendation_score: score,
        recommendation_reason: generateUserRecommendationReason(user, userProfile)
      }
    })

    return scoredUsers
      .sort((a: any, b: any) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit)

  } catch (error) {
    logger.error('Error generating user recommendations:', error)
    return []
  }
}

function generateRecommendationReasons(property: any, profile: any, preferences: any): string[] {
  const reasons = []

  if (profile?.city && property.city === profile.city) {
    reasons.push('Located in your area')
  }

  if (property.monthly_rent && preferences.budget) {
    const { min, max } = preferences.budget
    if ((!min || property.monthly_rent >= min) && (!max || property.monthly_rent <= max)) {
      reasons.push('Within your budget')
    }
  }

  if (property.surface_area && property.surface_area > 50) {
    reasons.push('Spacious property')
  }

  if (property.description && property.description.length > 200) {
    reasons.push('Detailed description')
  }

  const daysSinceCreated = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated < 7) {
    reasons.push('Recently listed')
  }

  return reasons.slice(0, 3) // Return top 3 reasons
}

function generateUserRecommendationReason(user: any, userProfile: any): string {
  if (user.city === userProfile.city) {
    return 'Also located in ' + user.city
  }
  if (user.user_type === userProfile.user_type) {
    return `Same role: ${user.user_type}`
  }
  return 'Active user in your area'
}