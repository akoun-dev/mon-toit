import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const useApplications = (userId?: string) => {
  return useQuery({
    queryKey: ['applications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('rental_applications')
        .select('*')
        .eq('applicant_id', userId);
      
      if (error) throw error;
      return (data as Application[]) || [];
    },
    enabled: !!userId
  });
};
