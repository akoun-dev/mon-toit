import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Calendar,
  Heart,
  Eye,
  Star,
  Navigation,
  X
} from 'lucide-react';

interface Property {
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
  latitude: number;
  longitude: number;
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
  is_favorite: boolean;
}

interface SearchFilters {
  city: string;
  neighborhood: string;
  property_type: string;
  min_price: number;
  max_price: number;
  min_surface: number;
  max_surface: number;
  bedrooms: number;
  furnished: boolean;
  available_immediately: boolean;
}

const CITIES = [
  { value: 'Abidjan', label: 'Abidjan' },
  { value: 'Bouaké', label: 'Bouaké' },
  { value: 'Yamoussoukro', label: 'Yamoussoukro' },
  { value: 'San-Pédro', label: 'San-Pédro' },
  { value: 'Daloa', label: 'Daloa' },
  { value: 'Korhogo', label: 'Korhogo' }
];

const NEIGHBORHOODS = {
  'Abidjan': [
    'Cocody', 'Plateau', 'Treichville', 'Yopougon', 'Abobo', 'Adjame',
    'Marcory', 'Attécoubé', 'Bingerville', 'Anyama', 'Songon'
  ],
  'Bouaké': ['Centre', 'Zonzan', 'Dar-es-Salam', 'Beoumi', 'Katiola'],
  'Yamoussoukro': ['Centre', 'Kossou', 'Toumodi', 'Didiévi'],
  'default': ['Centre-Ville', 'Zone Industrielle', 'Résidentiel']
};

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'loft', label: 'Loft' }
];

export default function TenantSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    neighborhood: '',
    property_type: '',
    min_price: 0,
    max_price: 500000,
    min_surface: 0,
    max_surface: 300,
    bedrooms: 0,
    furnished: false,
    available_immediately: false
  });

  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchFavorites();
    }
  }, [user, searchQuery, filters, sortBy, sortOrder]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          profiles:owner_id(full_name, avatar_url, user_type),
          property_media(type, url, caption)
        `)
        .eq('status', 'available');

      // Appliquer les filtres
      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      if (filters.neighborhood) {
        query = query.eq('neighborhood', filters.neighborhood);
      }

      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type);
      }

      if (filters.min_price > 0) {
        query = query.gte('monthly_rent', filters.min_price);
      }

      if (filters.max_price > 0) {
        query = query.lte('monthly_rent', filters.max_price);
      }

      if (filters.min_surface > 0) {
        query = query.gte('surface_area', filters.min_surface);
      }

      if (filters.max_surface > 0) {
        query = query.lte('surface_area', filters.max_surface);
      }

      if (filters.bedrooms > 0) {
        query = query.gte('bedrooms', filters.bedrooms);
      }

      if (filters.furnished) {
        query = query.eq('furnished', true);
      }

      if (filters.available_immediately) {
        query = query.eq('available_immediately', true);
      }

      // Recherche textuelle
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Tri
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      // Enrichir les données avec les médias et les favoris
      const enrichedProperties = (data || []).map(property => ({
        ...property,
        media: property.property_media || [],
        is_favorite: favorites.includes(property.id)
      }));

      setProperties(enrichedProperties);
    } catch (error) {
      logger.error('Error fetching properties', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les propriétés',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', user?.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.property_id) || []);
    } catch (error) {
      logger.error('Error fetching favorites', { error, userId: user?.id });
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    try {
      if (favorites.includes(propertyId)) {
        // Retirer des favoris
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('property_id', propertyId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== propertyId));
        toast({
          title: 'Retiré des favoris',
          description: 'La propriété a été retirée de vos favoris'
        });
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user?.id,
            property_id: propertyId
          });

        if (error) throw error;

        setFavorites(prev => [...prev, propertyId]);
        toast({
          title: 'Ajouté aux favoris',
          description: 'La propriété a été ajoutée à vos favoris'
        });
      }
    } catch (error) {
      logger.error('Error toggling favorite', { error, userId: user?.id, propertyId });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les favoris',
        variant: 'destructive'
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      neighborhood: '',
      property_type: '',
      min_price: 0,
      max_price: 500000,
      min_surface: 0,
      max_surface: 300,
      bedrooms: 0,
      furnished: false,
      available_immediately: false
    });
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const mainImage = property.media.find(m => m.type === 'image');
    const isInFavorites = favorites.includes(property.id);

    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(property.id);
              }}
            >
              <Heart className={`h-4 w-4 ${isInFavorites ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
          {property.available_immediately && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              Disponible immédiatement
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
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
              {PROPERTY_TYPES.find(t => t.value === property.property_type)?.label}
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

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-primary">
                {property.monthly_rent.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-muted-foreground">
                + {property.charges_amount?.toLocaleString() || 0} FCFA charges
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              Voir détails
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4 w-full">
        <DynamicBreadcrumb />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recherche de logements</h1>
          <p className="text-muted-foreground">
            Trouvez le logement parfait parmi nos annonces
          </p>
        </div>

        {/* Barre de recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {(filters.city || filters.property_type || filters.min_price > 0) && (
                    <Badge variant="secondary" className="ml-1">
                      {(filters.city ? 1 : 0) + (filters.property_type ? 1 : 0) + (filters.min_price > 0 ? 1 : 0)}
                    </Badge>
                  )}
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Plus récent</SelectItem>
                    <SelectItem value="monthly_rent">Prix croissant</SelectItem>
                    <SelectItem value="surface_area">Surface croissante</SelectItem>
                    <SelectItem value="bedrooms">Plus de chambres</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtres</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ville</label>
                  <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value, neighborhood: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quartier</label>
                  <Select
                    value={filters.neighborhood}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, neighborhood: value }))}
                    disabled={!filters.city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les quartiers" />
                    </SelectTrigger>
                    <SelectContent>
                      {(NEIGHBORHOODS[filters.city as keyof typeof NEIGHBORHOODS] || NEIGHBORHOODS.default).map(neighborhood => (
                        <SelectItem key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type de bien</label>
                  <Select value={filters.property_type} onValueChange={(value) => setFilters(prev => ({ ...prev, property_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Budget max: {filters.max_price.toLocaleString()} FCFA</label>
                  <Slider
                    value={[filters.max_price]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, max_price: value }))}
                    max={500000}
                    step={10000}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="furnished"
                    checked={filters.furnished}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, furnished: checked as boolean }))}
                  />
                  <label htmlFor="furnished" className="text-sm">Meublé</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={filters.available_immediately}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, available_immediately: checked as boolean }))}
                  />
                  <label htmlFor="available" className="text-sm">Disponible immédiatement</label>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Surface min: {filters.min_surface} m²</label>
                  <Slider
                    value={[filters.min_surface]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, min_surface: value }))}
                    max={200}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {properties.length} résultat{properties.length > 1 ? 's' : ''} trouvé{properties.length > 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun logement trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Essayez d'ajuster vos filtres ou votre recherche
              </p>
              <Button onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}