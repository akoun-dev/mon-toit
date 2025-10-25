import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Parse request body
    const body: RecommendationRequest = await req.json()
    const { userId, type, propertyId, limit = 5, preferences = {} } = body

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let recommendations = []

    switch (type) {
      case 'properties':
        recommendations = await generatePropertyRecommendations(supabase, userId, preferences, limit)
        break
      case 'areas':
        recommendations = await generateAreaRecommendations(supabase, userId, preferences, limit)
        break
      case 'users':
        recommendations = await generateUserRecommendations(supabase, userId, preferences, limit)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid recommendation type' }),
          { status: 400, headers: corsHeaders }
        )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: recommendations,
        type,
        userId,
        generated_at: new Date().toISOString()
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in recommendations function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        recommendations: []
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function generatePropertyRecommendations(supabase: any, userId: string, preferences: any, limit: number) {
  try {
    // Get user profile to understand preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, city, preferred_areas')
      .eq('id', userId)
      .single()

    // Get user favorites to understand preferences
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('property_id')
      .eq('user_id', userId)

    const favoritePropertyIds = favorites?.map((f: any) => f.property_id) || []

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!owner_profile(
          full_name,
          avatar_url,
          user_type
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
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
    if (favoritePropertyIds.length > 0) {
      query = query.not('id', 'in', favoritePropertyIds)
    }

    const { data: properties } = await query

    if (!properties || properties.length === 0) {
      return []
    }

    // Score and rank properties
    const scoredProperties = properties.map((property: any) => {
      let score = 0

      // Base score for being verified and active
      score += 10

      // Bonus for recent properties
      const daysSinceCreated = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 5
      else if (daysSinceCreated < 30) score += 3

      // Bonus for good photos
      if (property.photos && property.photos.length > 0) {
        score += Math.min(property.photos.length, 5)
      }

      // Bonus for complete description
      if (property.description && property.description.length > 100) {
        score += 3
      }

      // Bonus for amenities
      if (property.amenities && property.amenities.length > 0) {
        score += Math.min(property.amenities.length, 3)
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
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit)

  } catch (error) {
    console.error('Error generating property recommendations:', error)
    return []
  }
}

async function generateAreaRecommendations(supabase: any, userId: string, preferences: any, limit: number) {
  try {
    // Get popular areas based on property density
    const { data: properties } = await supabase
      .from('properties')
      .select('city, monthly_rent, property_type')
      .eq('is_active', true)
      .eq('is_verified', true)

    if (!properties || properties.length === 0) {
      return []
    }

    // Group by city and calculate metrics
    const areaStats = properties.reduce((acc: any, property: any) => {
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
    console.error('Error generating area recommendations:', error)
    return []
  }
}

async function generateUserRecommendations(supabase: any, userId: string, preferences: any, limit: number) {
  try {
    // Get user's profile to suggest similar users
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('user_type, city, interests')
      .eq('id', userId)
      .single()

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

    const { data: users } = await query

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
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit)

  } catch (error) {
    console.error('Error generating user recommendations:', error)
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

  if (property.photos && property.photos.length > 0) {
    reasons.push('Has photos available')
  }

  if (property.amenities && property.amenities.length > 0) {
    reasons.push(`${property.amenities.length} amenities`)
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