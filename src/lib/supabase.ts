import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { secureStorage } from '@/lib/secureStorage';

// Use environment variables with fallbacks (same as auto-generated client)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://btxhuqtirylvkgvoutoc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0eGh1cXRpcnlsdmtndm91dG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MDcsImV4cCI6MjA3NTE1NjQwN30.yjG6Xp3y6ZiJLRM1AInfP84U1AAL333u80iRXGnSnc4';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
