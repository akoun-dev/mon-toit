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

// Simplified environment detection - less aggressive clearing
const detectAndFixEnvironment = () => {
  const currentUrl = window.location.href;
  const isLocalDev = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');

  console.log('🔍 Environment detection:', {
    currentUrl,
    isLocalDev,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY.substring(0, 20) + '...'
  });

  // Only clear storage on explicit JWT errors, not automatically
  const hasJwtError = sessionStorage.getItem('supabase.jwt.error');
  if (hasJwtError) {
    console.warn('🔄 JWT error detected, clearing only invalid tokens');

    // Clear only the specific error flag, not all tokens
    sessionStorage.removeItem('supabase.jwt.error');
    console.log('✅ Cleared JWT error flag only');
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

// Create a single Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        try {
          // Utiliser localStorage directement pour la stabilité
          const value = localStorage.getItem(key);
          console.log(`🔍 Getting ${key} from localStorage:`, value ? 'found' : 'not found');
          return value;
        } catch (error) {
          console.warn(`⚠️  Error getting ${key} from storage:`, error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          console.log(`💾 Storing ${key} in localStorage`);
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.warn(`⚠️  Error storing ${key}:`, error);
          return Promise.reject(error);
        }
      },
      removeItem: (key: string) => {
        try {
          console.log(`🗑️  Removing ${key} from localStorage`);
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.warn(`⚠️  Error removing ${key}:`, error);
          return Promise.reject(error);
        }
      },
    },
    persistSession: true, // Enable session persistence
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  }
});
