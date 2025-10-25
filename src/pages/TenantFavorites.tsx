import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Calendar,
  ExternalLink,
  Trash2,
  Star
} from 'lucide-react';

interface FavoriteProperty {
  id: string;
  property_id: string;
  added_at: string;
  properties: {
    id: string;
    title: string;
    description: string;
    monthly_rent: number;
    deposit_amount: number;
    charges_amount: number;
    surface_area: number;
    bedrooms: number;
    bathrooms: number;
    city: string;
    neighborhood: string;
    property_type: string;
    furnished: boolean;
    available_immediately: boolean;
    available_from: string;
    status: string;
    created_at: string;
    owner_id: string;
    media: {
      type: string;
      url: string;
      caption?: string;
    }[];
    profiles: {
      full_name: string;
      avatar_url: string | null;
      user_type: string;
    };
  };
}

const PROPERTY_TYPES = {
  'apartment': 'Appartement',
  'house': 'Maison',
  'studio': 'Studio',
  'villa': 'Villa',
  'duplex': 'Duplex',
  'loft': 'Loft'
};

export default function TenantFavorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          properties (
            *,
            profiles:owner_id(full_name, avatar_url, user_type),
            property_media(type, url, caption)
          )
        `)
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Enrichir les données avec les médias
      const enrichedFavorites = (data || []).map(favorite => ({
        ...favorite,
        properties: {
          ...favorite.properties,
          media: favorite.properties.property_media || []
        }
      }));

      setFavorites(enrichedFavorites);
    } catch (error) {
      logger.error('Error fetching favorites', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos favoris',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('property_id', propertyId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
      toast({
        title: 'Retiré des favoris',
        description: 'Le logement a été retiré de vos favoris'
      });
    } catch (error) {
      logger.error('Error removing favorite', { error, userId: user?.id, propertyId });
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer ce logement des favoris',
        variant: 'destructive'
      });
    }
  };

  const applyForProperty = async (propertyId: string) => {
    try {
      // Vérifier si une candidature existe déjà
      const { data: existingApplication } = await supabase
        .from('rental_applications')
        .select('id')
        .eq('applicant_id', user?.id)
        .eq('property_id', propertyId)
        .single();

      if (existingApplication) {
        toast({
          title: 'Candidature existante',
          description: 'Vous avez déjà postulé pour ce logement',
          variant: 'destructive'
        });
        return;
      }

      // Créer une nouvelle candidature
      const { error } = await supabase
        .from('rental_applications')
        .insert({
          applicant_id: user?.id,
          property_id: propertyId,
          status: 'pending',
          cover_letter: 'Je suis intéressé(e) par ce logement et souhaite postuler.',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Candidature envoyée',
        description: 'Votre candidature a été envoyée avec succès'
      });

      navigate('/applications');
    } catch (error) {
      logger.error('Error applying for property', { error, userId: user?.id, propertyId });
      toast({
        title: 'Erreur',
        description: 'Impossible de postuler pour ce logement',
        variant: 'destructive'
      });
    }
  };

  const FavoriteCard = ({ favorite }: { favorite: FavoriteProperty }) => {
    const property = favorite.properties;
    const mainImage = property.media.find(m => m.type === 'image');
    const isAvailable = property.status === 'available';

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="relative">
          {mainImage && (
            <img
              src={mainImage.url}
              alt={mainImage.caption || property.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/80 hover:bg-white"
              onClick={() => removeFavorite(property.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
          {property.available_immediately && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              Disponible immédiatement
            </Badge>
          )}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Non disponible
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.neighborhood}, {property.city}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {property.description}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {PROPERTY_TYPES[property.property_type as keyof typeof PROPERTY_TYPES]}
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              {property.surface_area} m²
            </div>
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {property.bedrooms} chambres
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms} SDB
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xl font-bold text-primary">
                {property.monthly_rent.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-muted-foreground">
                + {property.charges_amount?.toLocaleString() || 0} FCFA charges
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-3">
            Ajouté aux favoris le {new Date(favorite.added_at).toLocaleDateString('fr-FR')}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir détails
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => applyForProperty(property.id)}
              disabled={!isAvailable}
            >
              Postuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Mes favoris
          </h1>
          <p className="text-muted-foreground">
            Gérez les logements que vous avez sauvegardés
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore ajouté de logement à vos favoris
              </p>
              <Button onClick={() => navigate('/search')}>
                <Star className="h-4 w-4 mr-2" />
                Rechercher des logements
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(favorite => (
              <FavoriteCard key={favorite.id} favorite={favorite} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}