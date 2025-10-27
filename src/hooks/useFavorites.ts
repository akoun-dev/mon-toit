import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Temporary type until Supabase types regenerate
type UserFavorite = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites' as any)
        .select('property_id')
        .eq('user_id', user.id) as { data: UserFavorite[] | null; error: any };

      if (error) {
        logger.debug('User favorites not accessible (likely RLS)', { error: error.message, userId: user.id });
        const localFavorites = localStorage.getItem(`favorites_${user.id}`);
        setFavorites(localFavorites ? JSON.parse(localFavorites) : []);
      } else {
        setFavorites(data?.map(f => f.property_id) || []);
      }
    } catch (err) {
      logger.debug('Exception fetching favorites', { error: err instanceof Error ? err.message : 'Unknown error', userId: user.id });
      const localFavorites = localStorage.getItem(`favorites_${user.id}`);
      setFavorites(localFavorites ? JSON.parse(localFavorites) : []);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter des favoris",
        variant: "destructive"
      });
      return;
    }

    const isFavorite = favorites.includes(propertyId);

    try {
      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites' as any)
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) {
          logger.debug('Failed to remove favorite (likely RLS)', { error: error.message, userId: user.id, propertyId });
          // Fallback to local storage
          const localFavorites = localStorage.getItem(`favorites_${user.id}`);
          const favorites = localFavorites ? JSON.parse(localFavorites) : [];
          const newFavorites = favorites.filter((id: string) => id !== propertyId);
          localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
          setFavorites(newFavorites);
          toast({
            title: "Favori retiré",
            description: "Le bien a été retiré de vos favoris"
          });
          return;
        }

        setFavorites(favorites.filter(id => id !== propertyId));
        toast({
          title: "Favori retiré",
          description: "Le bien a été retiré de vos favoris"
        });
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites' as any)
          .insert({ user_id: user.id, property_id: propertyId });

        if (error) {
          logger.debug('Failed to add favorite (likely RLS)', { error: error.message, userId: user.id, propertyId });
          // Fallback to local storage
          const localFavorites = localStorage.getItem(`favorites_${user.id}`);
          const favorites = localFavorites ? JSON.parse(localFavorites) : [];
          const newFavorites = [...favorites, propertyId];
          localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
          setFavorites(newFavorites);
          toast({
            title: "Favori ajouté",
            description: "Le bien a été ajouté à vos favoris"
          });
          return;
        }

        setFavorites([...favorites, propertyId]);
        toast({
          title: "Favori ajouté",
          description: "Le bien a été ajouté à vos favoris"
        });
      }

      // Update localStorage as backup
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(
        isFavorite ? favorites.filter(id => id !== propertyId) : [...favorites, propertyId]
      ));
    } catch (error) {
      logger.debug('Exception toggling favorite', { error: error instanceof Error ? error.message : 'Unknown error', propertyId, userId: user.id });
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos favoris",
        variant: "destructive"
      });
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};
