// Input validation utilities for Supabase Edge Functions

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateRecommendationRequest(data: any): ValidationResult {
  const errors: string[] = []

  // Validate required fields
  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('userId is required and must be a string')
  }

  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required and must be a string')
  }

  // Validate type
  const validTypes = ['properties', 'areas', 'users']
  if (data.type && !validTypes.includes(data.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`)
  }

  // Validate limit
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 100) {
      errors.push('limit must be a number between 1 and 100')
    }
  }

  // Validate preferences
  if (data.preferences && typeof data.preferences !== 'object') {
    errors.push('preferences must be an object')
  }

  // Validate budget preferences
  if (data.preferences?.budget) {
    const { min, max } = data.preferences.budget
    if (min !== undefined && (typeof min !== 'number' || min < 0)) {
      errors.push('budget.min must be a positive number')
    }
    if (max !== undefined && (typeof max !== 'number' || max < 0)) {
      errors.push('budget.max must be a positive number')
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('budget.min cannot be greater than budget.max')
    }
  }

  // Validate areas
  if (data.preferences?.areas) {
    if (!Array.isArray(data.preferences.areas)) {
      errors.push('preferences.areas must be an array')
    } else if (data.preferences.areas.some((area: any) => typeof area !== 'string')) {
      errors.push('all areas must be strings')
    }
  }

  // Validate property types
  if (data.preferences?.propertyTypes) {
    if (!Array.isArray(data.preferences.propertyTypes)) {
      errors.push('preferences.propertyTypes must be an array')
    } else if (data.preferences.propertyTypes.some((type: any) => typeof type !== 'string')) {
      errors.push('all propertyTypes must be strings')
    }
  }

  // Validate features
  if (data.preferences?.features) {
    if (!Array.isArray(data.preferences.features)) {
      errors.push('preferences.features must be an array')
    } else if (data.preferences.features.some((feature: any) => typeof feature !== 'string')) {
      errors.push('all features must be strings')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateMarketTrendsRequest(data: any): ValidationResult {
  const errors: string[] = []

  // Validate city filter
  if (data.city !== undefined) {
    if (typeof data.city !== 'string' || data.city.trim().length === 0) {
      errors.push('city must be a non-empty string')
    }
  }

  // Validate date range
  if (data.startDate !== undefined) {
    const startDate = new Date(data.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push('startDate must be a valid date')
    }
  }

  if (data.endDate !== undefined) {
    const endDate = new Date(data.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push('endDate must be a valid date')
    }
  }

  if (data.startDate !== undefined && data.endDate !== undefined) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (startDate >= endDate) {
      errors.push('startDate must be before endDate')
    }
  }

  // Validate limit
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 1000) {
      errors.push('limit must be a number between 1 and 1000')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeString(input: any): string {
  if (typeof input !== 'string') return ''
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizeNumber(input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
  const num = Number(input)
  if (isNaN(num) || num < min || num > max) return null
  return num
}

export function sanitizeArray(input: any, maxLength: number = 100): string[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
    .slice(0, maxLength)
}