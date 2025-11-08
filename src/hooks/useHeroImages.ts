import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroImage {
  id: string;
  title: string;
  alt_text: string;
  image_url: string;
  display_order: number;
}

export const useHeroImages = (deviceType: 'desktop' | 'mobile' | 'both' = 'both') => {
  return useQuery({
    queryKey: ['hero-images', deviceType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_hero_images', {
        p_device_type: deviceType
      });

      if (error) {
        console.error('Error fetching hero images:', error);
        return [];
      }
      
      return (data || []) as HeroImage[];
    },
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
  });
};
