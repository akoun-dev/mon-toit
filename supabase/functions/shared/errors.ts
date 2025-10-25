// Error handling utilities for Supabase Edge Functions

export enum ErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CACHE_ERROR = 'CACHE_ERROR'
}

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: string
  requestId?: string
}

export interface LogEntry {
  level: LogLevel
  message: string
  error?: any
  context?: any
  timestamp: string
  requestId?: string
}

class Logger {
  private requestId?: string

  constructor(requestId?: string) {
    this.requestId = requestId
  }

  private log(level: LogLevel, message: string, error?: any, context?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      error,
      context,
      timestamp: new Date().toISOString(),
      requestId: this.requestId
    }

    console.log(JSON.stringify(logEntry))
  }

  error(message: string, error?: any, context?: any): void {
    this.log(LogLevel.ERROR, message, error, context)
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, undefined, context)
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, undefined, context)
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, undefined, context)
  }
}

export function createLogger(request?: Request): Logger {
  const requestId = request?.headers.get('x-request-id') || 
                   crypto.randomUUID()
  return new Logger(requestId)
}

export function createApiError(
  code: ErrorCode, 
  message: string, 
  details?: any,
  requestId?: string
): ApiError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId
  }
}

export function handleApiError(
  error: any, 
  logger: Logger, 
  requestId?: string
): ApiError {
  // Log the error
  logger.error('API Error occurred', error, { requestId })

  // Handle specific error types
  if (error.code === 'PGRST116') {
    return createApiError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid data provided',
      error.details,
      requestId
    )
  }

  if (error.code === 'PGRST301') {
    return createApiError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      error.details,
      requestId
    )
  }

  if (error.code?.startsWith('PGRST')) {
    return createApiError(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      error.message,
      requestId
    )
  }

  // Generic error
  return createApiError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    requestId
  )
}

export function createSuccessResponse<T>(
  data: T, 
  message?: string,
  metadata?: any
): { success: true; data: T; message?: string; metadata?: any } {
  return {
    success: true,
    data,
    message,
    metadata
  }
}

export function createErrorResponse(
  error: ApiError
): { success: false; error: ApiError } {
  return {
    success: false,
    error
  }
}

// Rate limiting utilities
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): { allowed: boolean; resetTime: number } {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetTime) {
      // New entry or expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs
      }
      this.limits.set(key, newEntry)
      return { allowed: true, resetTime: newEntry.resetTime }
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime }
    }

    // Increment count
    entry.count++
    this.limits.set(key, entry)
    return { allowed: true, resetTime: entry.resetTime }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// Rate limiters for different endpoints
export const rateLimiters = {
  recommendations: new RateLimiter(10, 60 * 1000), // 10 requests per minute
  marketTrends: new RateLimiter(5, 60 * 1000),    // 5 requests per minute
  default: new RateLimiter(20, 60 * 1000)          // 20 requests per minute
}

// Cleanup rate limiters every 5 minutes
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup())
}, 5 * 60 * 1000)

export function checkRateLimit(
  key: string, 
  limiter: RateLimiter
): { allowed: boolean; resetTime: number; error?: ApiError } {
  const result = limiter.isAllowed(key)
  
  if (!result.allowed) {
    return {
      ...result,
      error: createApiError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        {
          resetTime: new Date(result.resetTime).toISOString(),
          limitMs: limiter['windowMs']
        }
      )
    }
  }

  return result
}