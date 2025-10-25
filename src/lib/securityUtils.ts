/**
 * Security Utilities
 * Collection of security-related functions and utilities
 */

import { supabase } from './supabase';

// Constants for timing protection
export const TIMING_PROTECTION = {
  MIN_DELAY: 200, // minimum 200ms response time
  MAX_DELAY: 500, // maximum 500ms response time
  JITTER_RANGE: 100 // random jitter range
} as const;

// Password strength validation
export const passwordStrength = {
  check: (password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Le mot de passe doit contenir au moins 8 caractères');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Le mot de passe doit contenir au moins une majuscule');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Le mot de passe doit contenir au moins une minuscule');

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Le mot de passe doit contenir au moins un chiffre');

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Le mot de passe doit contenir au moins un caractère spécial');

    return {
      score,
      feedback,
      isValid: score >= 4 // Require at least 4/5 criteria
    };
  }
};

// Input validators
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  password: (password: string): boolean => {
    return passwordStrength.check(password).isValid;
  },

  otpCode: (code: string): boolean => {
    return /^\d{6}$/.test(code);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  sanitizedName: (name: string): boolean => {
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z0-9\s\-'\u00C0-\u017F]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  },

  strongPassword: (password: string): boolean => {
    const checks = [
      password.length >= 12,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    return checks.filter(Boolean).length >= 4;
  }
};

// Rate limiting utilities
export const rateLimiter = {
  // Generate rate limit key
  generateKey: (identifier: string, action: string): string => {
    return `rate_limit:${action}:${identifier}`;
  },

  // Check rate limit using localStorage for client-side
  check: (key: string, maxAttempts: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing attempts
    const attempts: number[] = JSON.parse(localStorage.getItem(key) || '[]');

    // Filter out old attempts
    const validAttempts = attempts.filter(timestamp => timestamp > windowStart);

    // Check if allowed
    const allowed = validAttempts.length < maxAttempts;

    return {
      allowed,
      remaining: Math.max(0, maxAttempts - validAttempts.length),
      resetTime: validAttempts.length > 0 ? Math.max(...validAttempts) + windowMs : now + windowMs
    };
  },

  // Record attempt
  record: (key: string): void => {
    const now = Date.now();
    const attempts: number[] = JSON.parse(localStorage.getItem(key) || '[]');
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));
  },

  // Clear attempts
  clear: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// Timing attack protection
export const withTimingProtection = async <T>(
  operation: () => Promise<T>,
  minDelay: number = TIMING_PROTECTION.MIN_DELAY
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await operation();
    const operationTime = Date.now() - startTime;

    // Ensure minimum response time
    if (operationTime < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - operationTime));
    }

    return result;
  } catch (error) {
    const operationTime = Date.now() - startTime;

    // Still ensure minimum timing even on error
    if (operationTime < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - operationTime));
    }

    throw error;
  }
};

// Security event logging
export const logSecurityEvent = async (
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, any>
): Promise<void> => {
  try {
    // Get client info
    const clientInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer
    };

    // Log to database
    const { error } = await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_severity: severity,
      p_source: 'client',
      p_details: {
        ...clientInfo,
        ...details
      }
    });

    if (error && process.env.NODE_ENV === 'development') {
      console.warn('Failed to log security event:', error);
    }
  } catch (error) {
    // Silent fail for security logging
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security event logging failed:', error);
    }
  }
};

// Input sanitization
export const sanitize = {
  // Sanitize string input
  string: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  },

  // Sanitize email
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Sanitize phone number
  phone: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  },

  // Sanitize URL
  url: (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return '';
    }
  }
};

// CSRF protection utilities
export const csrf = {
  // Generate CSRF token
  generateToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Get stored token
  getToken: (): string | null => {
    return sessionStorage.getItem('csrf_token');
  },

  // Store token
  setToken: (token: string): void => {
    sessionStorage.setItem('csrf_token', token);
  },

  // Verify token
  verifyToken: (token: string): boolean => {
    const storedToken = csrf.getToken();
    return storedToken !== null && storedToken === token;
  },

  // Initialize CSRF protection
  init: (): string => {
    let token = csrf.getToken();
    if (!token) {
      token = csrf.generateToken();
      csrf.setToken(token);
    }
    return token;
  }
};

// Device fingerprinting
export const deviceFingerprint = {
  // Generate device fingerprint
  generate: async (): Promise<string> => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!navigator.hardwareConcurrency,
      !!navigator.cookieEnabled,
      !!navigator.doNotTrack
    ];

    // Add canvas fingerprint if available
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        components.push(canvas.toDataURL());
      }
    } catch {
      // Canvas not available
    }

    // Create hash
    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

// Secure random utilities
export const secureRandom = {
  // Generate secure random string
  string: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  },

  // Generate secure random number
  number: (min: number, max: number): number => {
    const range = max - min + 1;
    const bytes = Math.ceil(Math.log2(range) / 8);
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);

    let value = 0;
    for (let i = 0; i < bytes; i++) {
      value = (value << 8) + array[i];
    }

    return min + (value % range);
  },

  // Generate secure random bytes
  bytes: (length: number): Uint8Array => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }
};

// Password utilities
export const passwords = {
  // Generate secure password
  generate: (length: number = 16, options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {}): string => {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true
    } = options;

    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars === '') throw new Error('At least one character type must be included');

    let password = '';
    const randomValues = secureRandom.bytes(length);

    for (let i = 0; i < length; i++) {
      password += chars[randomValues[i] % chars.length];
    }

    return password;
  },

  // Estimate password strength (0-4)
  estimateStrength: (password: string): number => {
    let strength = 0;

    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return Math.min(4, Math.floor(strength * 0.8));
  }
};

// Export all utilities
export default {
  TIMING_PROTECTION,
  passwordStrength,
  validators,
  rateLimiter,
  withTimingProtection,
  logSecurityEvent,
  sanitize,
  csrf,
  deviceFingerprint,
  secureRandom,
  passwords
};