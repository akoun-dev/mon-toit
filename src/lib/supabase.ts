import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { secureStorage } from '@/lib/secureStorage';

// Use environment variables with fallbacks for local development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
// IMPORTANT: Only use ANON key in the client. Do not accept/allow service_role keys here.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => secureStorage.getItem(key, true),
      setItem: (key: string, value: string) => secureStorage.setItem(key, value, true),
      removeItem: (key: string) => secureStorage.removeItem(key),
    },
    persistSession: true,
    autoRefreshToken: true,
  }
});
