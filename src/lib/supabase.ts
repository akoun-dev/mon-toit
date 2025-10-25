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

  // Force clear all Supabase-related storage if in local dev
  if (isLocalDev && SUPABASE_URL.includes('127.0.0.1')) {
    console.warn('🔄 Local development detected - clearing all Supabase storage');

    // Clear all possible Supabase storage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Also clear session storage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    console.log(`✅ Cleared ${keysToRemove.length} localStorage keys and ${sessionKeysToRemove.length} sessionStorage keys`);
  }
};

// Run environment detection
detectAndFixEnvironment();

// Temporarily disable secure storage to force clear tokens
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        // For development, always return null to force fresh session
        console.log(`🗑️  Blocking access to ${key} - forcing fresh session`);
        return null;
      },
      setItem: (key: string, value: string) => {
        console.log(`💾 Storing ${key} in secure storage`);
        return secureStorage.setItem(key, value, true);
      },
      removeItem: (key: string) => {
        console.log(`🗑️  Removing ${key} from secure storage`);
        return secureStorage.removeItem(key);
      },
    },
    persistSession: false, // Temporarily disable persistence
    autoRefreshToken: true,
  }
});
