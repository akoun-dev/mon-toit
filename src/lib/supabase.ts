import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { secureStorage } from '@/lib/secureStorage';

// Use environment variables with fallbacks for local development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
// IMPORTANT: Only use ANON key in the client. Do not accept/allow service_role keys here.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Force the correct key for local development
const FINAL_SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Debug: Log the actual key being used (remove in production)
console.log('🔑 Supabase URL:', SUPABASE_URL);
console.log('🔑 Original ANON Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
console.log('🔑 Final ANON Key:', FINAL_SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Create standard Supabase client with auth for authenticated operations
export const supabase = createClient<Database>(SUPABASE_URL, FINAL_SUPABASE_ANON_KEY);

// Create a separate public client for unauthenticated requests (overrides auth headers)
export const supabasePublic = createClient<Database>(SUPABASE_URL, FINAL_SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'apikey': FINAL_SUPABASE_ANON_KEY,
      // Override any Authorization header that might be set automatically
    },
    fetch: (url, options = {}) => {
      // Remove Authorization header completely for public access
      const headers = { ...options.headers };
      delete headers['Authorization'];

      return fetch(url, {
        ...options,
        headers,
      });
    },
  },
});
