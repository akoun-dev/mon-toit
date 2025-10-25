// Simple in-memory cache for Supabase Edge Functions
interface CacheEntry<T> {
  data: T
  expiresAt: number
  key: string
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: number

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiresAt, key })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    return this.cache.size
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Global cache instance
const globalCache = new MemoryCache()

// Cache key generators
export const CacheKeys = {
  marketTrends: (filters: any) => `market_trends:${JSON.stringify(filters)}`,
  propertyRecommendations: (userId: string, preferences: any) => 
    `property_recommendations:${userId}:${JSON.stringify(preferences)}`,
  areaRecommendations: (userId: string, preferences: any) => 
    `area_recommendations:${userId}:${JSON.stringify(preferences)}`,
  userRecommendations: (userId: string, preferences: any) => 
    `user_recommendations:${userId}:${JSON.stringify(preferences)}`,
  userProfile: (userId: string) => `user_profile:${userId}`,
  userFavorites: (userId: string) => `user_favorites:${userId}`,
  popularAreas: () => 'popular_areas',
  propertyStats: (propertyId: string) => `property_stats:${propertyId}`
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600    // 1 hour
}

// Cache wrapper functions
export async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = globalCache.get<T>(key)
  if (cached !== null) {
    console.log(`Cache hit for key: ${key}`)
    return cached
  }

  // Cache miss - fetch data
  console.log(`Cache miss for key: ${key}`)
  const data = await fetcher()
  
  // Store in cache
  globalCache.set(key, data, ttl)
  
  return data
}

export function invalidateCache(pattern: string): void {
  const stats = globalCache.getStats()
  const keysToDelete = stats.keys.filter(key => key.includes(pattern))
  
  keysToDelete.forEach(key => {
    globalCache.delete(key)
  })
  
  console.log(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`)
}

export function invalidateUserCache(userId: string): void {
  invalidateCache(`recommendations:${userId}`)
  invalidateCache(`user_profile:${userId}`)
  invalidateCache(`user_favorites:${userId}`)
}

export function getCacheStats(): { size: number; keys: string[] } {
  return globalCache.getStats()
}

// Export the cache instance for advanced usage
export { globalCache as cache }