import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/services/logger';

export interface PropertyView {
  id: string;
  property_id: string;
  user_id: string | null;
  viewed_at: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  referrer?: string;
}

/**
 * Hook pour gérer le tracking des vues des propriétés
 */
export const usePropertyViews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Enregistrer une vue de propriété
  const trackPropertyView = useMutation({
    mutationFn: async (propertyId: string) => {
      const viewData: Partial<PropertyView> = {
        property_id: propertyId,
        user_id: user?.id || null,
        ip_address: null, // Sera rempli par le backend si nécessaire
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || generateSessionId(),
        referrer: document.referrer || null,
      };

      const { data, error } = await supabase
        .from('property_views')
        .insert(viewData)
        .select()
        .single();

      if (error) {
        // Si l'erreur est une violation de contrainte unique, c'est normal (déjà vu aujourd'hui)
        if (error.code === '23505') {
          logger.debug('Property view already tracked today', { propertyId, userId: user?.id });
          return null;
        }
        throw error;
      }

      // Incrémenter le compteur de vues dans la table properties
      await supabase.rpc('increment_property_view', { property_uuid: propertyId });

      return data;
    },
    onSuccess: (data, propertyId) => {
      // Invalider le cache des statistiques de la propriété
      queryClient.invalidateQueries({ queryKey: ['property-stats', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['owner-analytics'] });

      if (data) {
        logger.debug('Property view tracked', { propertyId, viewId: data.id });
      }
    },
    onError: (error, propertyId) => {
      logger.error('Failed to track property view', { error, propertyId, userId: user?.id });
    },
  });

  // Obtenir les statistiques de vues pour une propriété
  const getPropertyViewStats = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase
        .from('property_views')
        .select('viewed_at, user_id')
        .eq('property_id', propertyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const stats = {
        totalViews: data?.length || 0,
        uniqueViews: new Set(data?.map(v => v.user_id)).size,
        todayViews: data?.filter(v =>
          new Date(v.viewed_at).toDateString() === new Date().toDateString()
        ).length || 0,
        thisWeekViews: data?.filter(v => {
          const viewDate = new Date(v.viewed_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return viewDate >= weekAgo;
        }).length || 0,
        thisMonthViews: data?.filter(v => {
          const viewDate = new Date(v.viewed_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return viewDate >= monthAgo;
        }).length || 0,
      };

      return stats;
    },
  });

  // Obtenir les vues récentes pour le propriétaire
  const getRecentViews = useMutation({
    mutationFn: async (ownerId: string) => {
      const { data, error } = await supabase
        .from('property_views')
        .select(`
          *,
          properties!inner(
            id,
            title,
            main_image,
            monthly_rent,
            status,
            city,
            neighborhood
          )
        `)
        .in('property_id', (
          supabase
            .from('properties')
            .select('id')
            .eq('owner_id', ownerId)
        ))
        .order('viewed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Fonction utilitaire pour générer un ID de session
  function generateSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  return {
    trackPropertyView: trackPropertyView.mutate,
    getPropertyViewStats: getPropertyViewStats.mutate,
    getRecentViews: getRecentViews.mutate,
    isTracking: trackPropertyView.isPending,
  };
};