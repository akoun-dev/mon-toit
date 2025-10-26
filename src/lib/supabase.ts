import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { secureStorage } from '@/lib/secureStorage';

// Use environment variables with fallbacks for local development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
// IMPORTANT: Only use ANON key in the client. Do not accept/allow service_role keys here.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Debug: Log the actual key being used (remove in production)
console.log('🔑 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase ANON Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Auto-detect and fix environment mismatch
const detectAndFixEnvironment = () => {
  const currentUrl = window.location.href;
  const isLocalDev = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');

  console.log('🔍 Environment detection:', {
    currentUrl,
    isLocalDev,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY.substring(0, 20) + '...'
  });

  // Only clear storage if there's a JWT parsing issue (not always)
  // This prevents clearing valid tokens on every page load
  const hasJwtError = sessionStorage.getItem('supabase.jwt.error');
  if (hasJwtError) {
    console.warn('🔄 JWT error detected, clearing Supabase storage');
    
    // Clear all possible Supabase storage keys from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        secureStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    });

    // Also clear related metadata
    const metaKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-')) && key.endsWith('_meta')) {
        metaKeysToRemove.push(key);
      }
    }

    metaKeysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear session storage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-'))) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Clear the error flag
    sessionStorage.removeItem('supabase.jwt.error');
    
    console.log(`✅ Cleared ${keysToRemove.length + metaKeysToRemove.length} localStorage keys and ${sessionKeysToRemove.length} sessionStorage keys`);
  } else {
    console.log('✅ No JWT error detected, keeping existing tokens');
  }
};

// Set up error handler to detect JWT issues
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && event.reason.message) {
    if (event.reason.message.includes('Expected 3 parts in JWT') || event.reason.message.includes('JWT')) {
      console.warn('🔍 JWT error detected, flagging for cleanup');
      sessionStorage.setItem('supabase.jwt.error', 'true');
    }
  }
});

// Run environment detection
detectAndFixEnvironment();

// Create anonymous Supabase client for public data (no authentication)
export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Don't persist sessions for anon client
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
  }
});

// Create authenticated Supabase client with proper storage configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        try {
          console.log(`🔍 Getting ${key} from secure storage`);
          return secureStorage.getItem(key);
        } catch (error) {
          console.warn(`⚠️  Error getting ${key} from storage:`, error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          console.log(`💾 Storing ${key} in secure storage`);
          return secureStorage.setItem(key, value, true);
        } catch (error) {
          console.warn(`⚠️  Error storing ${key}:`, error);
          return null;
        }
      },
      removeItem: (key: string) => {
        try {
          console.log(`🗑️  Removing ${key} from secure storage`);
          return secureStorage.removeItem(key);
        } catch (error) {
          console.warn(`⚠️  Error removing ${key}:`, error);
          return null;
        }
      },
    },
    persistSession: true, // Enable session persistence
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  }
});
