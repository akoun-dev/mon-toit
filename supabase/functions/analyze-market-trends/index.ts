import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

import { handleCors, createCorsResponse, createErrorResponse } from '../shared/cors.ts'
import { requireAuth, createSupabaseClient } from '../shared/auth.ts'
import { validateMarketTrendsRequest } from '../shared/validation.ts'
import { getCachedData, CacheKeys, CacheTTL } from '../shared/cache.ts'
import { createLogger, handleApiError, createSuccessResponse, ErrorCode } from '../shared/errors.ts'

interface MarketTrendsRequest {
  city?: string
  startDate?: string
  endDate?: string
  limit?: number
}

interface MarketTrendsResponse {
  summary: {
    average_rent: number
    properties_count: number
    popular_neighborhoods: string[]
    price_trend: 'increasing' | 'stable' | 'decreasing'
    demand_level: 'low' | 'medium' | 'high'
  }
  monthly_trends: Array<{
    month: string
    average_rent: number
    properties_count: number
  }>
  neighborhood_stats: Array<{
    neighborhood: string
    average_rent: number
    properties_count: number
    price_trend: 'increasing' | 'stable' | 'decreasing'
  }>
  recommendations: Array<{
    type: 'investment' | 'search'
    area: string
    reason: string
  }>
}

serve(async (req) => {
  const logger = createLogger(req)
  
  try {
    // Handle CORS preflight requests
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method Not Allowed', 405)
    }

    // Parse and validate request body
    const body: MarketTrendsRequest = await req.json()
    const validation = validateMarketTrendsRequest(body)
    
    if (!validation.isValid) {
      logger.warn('Invalid request data', { errors: validation.errors })
      return createErrorResponse(
        `Validation failed: ${validation.errors.join(', ')}`,
        400
      )
    }

    // Authenticate user (optional for market trends, but we track usage)
    const authResult = await requireAuth(req)
    const user = authResult.user
    if (authResult.response) {
      // If auth fails, we still allow anonymous access but log it
      logger.warn('Unauthenticated access to market trends')
    }

    // Create cache key based on filters
    const cacheKey = CacheKeys.marketTrends(body)
    
    // Try to get from cache first
    const cachedData = await getCachedData(
      cacheKey,
      () => fetchMarketTrends(body, logger),
      CacheTTL.LONG // 30 minutes cache for market data
    )

    logger.info('Market trends retrieved successfully', {
      userId: user?.id,
      filters: body
    })

    return createCorsResponse(
      createSuccessResponse(cachedData, 'Market trends retrieved successfully')
    )

  } catch (error) {
    logger.error('Error in market trends function', error)
    
    const apiError = handleApiError(error, logger)
    return createCorsResponse(
      { success: false, error: apiError },
      apiError.code === ErrorCode.INTERNAL_ERROR ? 500 : 400
    )
  }
})

async function fetchMarketTrends(
  filters: MarketTrendsRequest,
  logger: any
): Promise<MarketTrendsResponse> {
  const supabase = createSupabaseClient()
  
  try {
    // Build base query
    let query = supabase
      .from('properties')
      .select('city, neighborhood, monthly_rent, created_at, status')
      .eq('status', 'disponible')

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    // Apply limit
    const limit = Math.min(filters.limit || 1000, 1000)
    query = query.limit(limit)

    const { data: properties, error } = await query

    if (error) {
      logger.error('Database error fetching properties', error)
      throw error
    }

    if (!properties || properties.length === 0) {
      // Return empty trends if no data
      return createEmptyTrends()
    }

    // Process the data
    return processMarketData(properties, filters)

  } catch (error) {
    logger.error('Error fetching market trends', error)
    throw error
  }
}

function processMarketData(
  properties: any[],
  filters: MarketTrendsRequest
): MarketTrendsResponse {
  // Calculate summary statistics
  const averageRent = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) / properties.length
  
  // Get popular neighborhoods
  const neighborhoodCounts: Record<string, number> = properties.reduce((acc, p) => {
    const neighborhood = p.neighborhood || 'Unknown'
    acc[neighborhood] = (acc[neighborhood] || 0) + 1
    return acc
  }, {})

  const popularNeighborhoods = Object.entries(neighborhoodCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([neighborhood]) => neighborhood)

  // Calculate price trend (simple comparison with last month)
  const priceTrend = calculatePriceTrend(properties)

  // Calculate demand level based on properties count and growth
  const demandLevel = calculateDemandLevel(properties)

  // Generate monthly trends
  const monthlyTrends = generateMonthlyTrends(properties)

  // Generate neighborhood statistics
  const neighborhoodStats = generateNeighborhoodStats(properties)

  // Generate recommendations
  const recommendations = generateRecommendations(neighborhoodStats, averageRent)

  return {
    summary: {
      average_rent: Math.round(averageRent),
      properties_count: properties.length,
      popular_neighborhoods: popularNeighborhoods,
      price_trend: priceTrend,
      demand_level: demandLevel
    },
    monthly_trends: monthlyTrends,
    neighborhood_stats: neighborhoodStats,
    recommendations
  }
}

function calculatePriceTrend(properties: any[]): 'increasing' | 'stable' | 'decreasing' {
  if (properties.length < 10) return 'stable'

  // Sort by creation date
  const sortedProperties = [...properties].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Compare first half with second half
  const midpoint = Math.floor(sortedProperties.length / 2)
  const firstHalf = sortedProperties.slice(0, midpoint)
  const secondHalf = sortedProperties.slice(midpoint)

  const firstHalfAvg = firstHalf.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) / secondHalf.length

  const difference = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

  if (difference > 5) return 'increasing'
  if (difference < -5) return 'decreasing'
  return 'stable'
}

function calculateDemandLevel(properties: any[]): 'low' | 'medium' | 'high' {
  const recentProperties = properties.filter(p => {
    const createdAt = new Date(p.created_at)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return createdAt > thirtyDaysAgo
  })

  const recentRatio = recentProperties.length / properties.length

  if (recentRatio > 0.3) return 'high'
  if (recentRatio > 0.15) return 'medium'
  return 'low'
}

function generateMonthlyTrends(properties: any[]): Array<{
  month: string
  average_rent: number
  properties_count: number
}> {
  const monthlyData: Record<string, number[]> = properties.reduce((acc, property) => {
    const date = new Date(property.created_at)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format

    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(property.monthly_rent || 0)
    return acc
  }, {})

  return Object.entries(monthlyData)
    .map(([month, rents]) => ({
      month,
      average_rent: Math.round(rents.reduce((sum: number, rent: number) => sum + rent, 0) / rents.length),
      properties_count: rents.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6) // Last 6 months
}

function generateNeighborhoodStats(properties: any[]): Array<{
  neighborhood: string
  average_rent: number
  properties_count: number
  price_trend: 'increasing' | 'stable' | 'decreasing'
}> {
  const neighborhoodData: Record<string, number[]> = properties.reduce((acc, property) => {
    const neighborhood = property.neighborhood || 'Unknown'
    
    if (!acc[neighborhood]) {
      acc[neighborhood] = []
    }
    acc[neighborhood].push(property.monthly_rent || 0)
    return acc
  }, {})

  return Object.entries(neighborhoodData)
    .map(([neighborhood, rents]) => ({
      neighborhood,
      average_rent: Math.round(rents.reduce((sum: number, rent: number) => sum + rent, 0) / rents.length),
      properties_count: rents.length,
      price_trend: 'stable' as const // Simplified for now
    }))
    .sort((a, b) => b.properties_count - a.properties_count)
    .slice(0, 10) // Top 10 neighborhoods
}

function generateRecommendations(
  neighborhoodStats: any[],
  averageRent: number
): Array<{
  type: 'investment' | 'search'
  area: string
  reason: string
}> {
  const recommendations: Array<{
    type: 'investment' | 'search'
    area: string
    reason: string
  }> = []

  // Find affordable neighborhoods with good potential
  const affordableNeighborhoods = neighborhoodStats
    .filter(stat => stat.average_rent < averageRent * 0.8)
    .sort((a, b) => a.average_rent - b.average_rent)

  if (affordableNeighborhoods.length > 0) {
    recommendations.push({
      type: 'investment',
      area: affordableNeighborhoods[0].neighborhood,
      reason: 'Prix abordables avec bon potentiel de rendement'
    })
  }

  // Find popular neighborhoods
  const popularNeighborhoods = neighborhoodStats
    .filter(stat => stat.properties_count >= 5)
    .sort((a, b) => b.properties_count - a.properties_count)

  if (popularNeighborhoods.length > 0) {
    recommendations.push({
      type: 'search',
      area: popularNeighborhoods[0].neighborhood,
      reason: 'Zone populaire avec forte demande locative'
    })
  }

  return recommendations
}

function createEmptyTrends(): MarketTrendsResponse {
  return {
    summary: {
      average_rent: 0,
      properties_count: 0,
      popular_neighborhoods: [],
      price_trend: 'stable',
      demand_level: 'low'
    },
    monthly_trends: [],
    neighborhood_stats: [],
    recommendations: []
  }
}