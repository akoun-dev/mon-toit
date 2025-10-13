// Temporary config file to force environment variable loading
export const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://btxhuqtirylvkgvoutoc.supabase.co';
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0eGh1cXRpcnlsdmtndm91dG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MDcsImV4cCI6MjA3NTE1NjQwN30.yjG6Xp3y6ZiJLRM1AInfP84U1AAL333u80iRXGnSnc4';
  
  console.log('Supabase URL loaded:', url ? 'Yes ✓' : 'No ✗');
  console.log('Supabase Key loaded:', key ? 'Yes ✓' : 'No ✗');
  
  return { url, key };
};
