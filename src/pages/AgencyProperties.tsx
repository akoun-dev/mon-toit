import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  Building,
  Plus,
  Edit,
  Eye,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Home,
  Camera,
  Upload,
  X,
  Search,
  Filter
} from 'lucide-react';

interface ManagedProperty {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  neighborhood: string;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  surface_area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  available_immediately: boolean;
  available_from: string;
  status: string;
  owner_id: string;
  agency_id: string;
  created_at: string;
  updated_at: string;
  media: {
    type: string;
    url: string;
    caption?: string;
  }[];
  owner_profile?: {
    full_name: string;
    phone: string;
    email: string;
  };
  mandates?: {
    id: string;
    mandate_type: string;
    status: string;
    start_date: string;
    end_date: string;
  }[];
}

interface CreatePropertyData {
  title: string;
  description: string;
  address: string;
  city: string;
  neighborhood: string;
  monthly_rent: number;
  deposit_amount: number;
  charges_amount: number;
  surface_area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  available_immediately: boolean;
  available_from: string;
}

const PROPERTY_TYPES = {
  'apartment': 'Appartement',
  'house': 'Maison',
  'studio': 'Studio',
  'villa': 'Villa',
  'duplex': 'Duplex',
  'loft': 'Loft'
};

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
  'default': ['Centre-Ville', 'Zone Industrielle', 'Résidentiel']
};

export default function AgencyProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newProperty, setNewProperty] = useState<CreatePropertyData>({
    title: '',
    description: '',
    address: '',
    city: '',
    neighborhood: '',
    monthly_rent: 0,
    deposit_amount: 0,
    charges_amount: 0,
    surface_area: 0,
    bedrooms: 0,
    bathrooms: 0,
    property_type: 'apartment',
    furnished: false,
    available_immediately: true,
    available_from: ''
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchClients();
    }
  }, [user, searchQuery, statusFilter]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner_profile:owner_id(full_name, phone, email),
          property_media(type, url, caption),
          agency_mandates(id, mandate_type, status, start_date, end_date)
        `)
        .eq('agency_id', user?.id);

      // Appliquer les filtres
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Recherche textuelle
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir les données avec les médias
      const enrichedProperties = (data || []).map(property => ({
        ...property,
        media: property.property_media || [],
        mandates: property.agency_mandates || []
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, user_type')
        .eq('user_type', 'proprietaire')
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      logger.error('Error fetching clients', { error, userId: user?.id });
    }
  };

  const createProperty = async () => {
    if (!newProperty.title || !newProperty.address || !newProperty.city) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Trouver un propriétaire par défaut (premier dans la liste)
      const defaultOwner = clients[0];
      if (!defaultOwner) {
        toast({
          title: 'Erreur',
          description: 'Aucun propriétaire disponible. Veuillez d\'abord ajouter des propriétaires.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('properties')
        .insert({
          ...newProperty,
          owner_id: defaultOwner.id,
          agency_id: user?.id,
          status: 'available',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Propriété créée',
        description: 'La propriété a été créée avec succès'
      });

      setShowCreateDialog(false);
      setNewProperty({
        title: '',
        description: '',
        address: '',
        city: '',
        neighborhood: '',
        monthly_rent: 0,
        deposit_amount: 0,
        charges_amount: 0,
        surface_area: 0,
        bedrooms: 0,
        bathrooms: 0,
        property_type: 'apartment',
        furnished: false,
        available_immediately: true,
        available_from: ''
      });

      fetchProperties();
    } catch (error) {
      logger.error('Error creating property', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la propriété',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `La propriété est maintenant ${newStatus === 'available' ? 'disponible' : 'indisponible'}`
      });

      fetchProperties();
    } catch (error) {
      logger.error('Error updating property status', { error, userId: user?.id, propertyId });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Propriété supprimée',
        description: 'La propriété a été supprimée avec succès'
      });

      fetchProperties();
    } catch (error) {
      logger.error('Error deleting property', { error, userId: user?.id, propertyId });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la propriété',
        variant: 'destructive'
      });
    }
  };

  const PropertyCard = ({ property }: { property: ManagedProperty }) => {
    const mainImage = property.media.find(m => m.type === 'image');
    const activeMandate = property.mandates?.find(m => m.status === 'active');

    return (
      <Card>
        <div className="relative">
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={mainImage.caption || property.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <Building className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={property.status === 'available' ? 'bg-green-500' : 'bg-red-500'}>
              {property.status === 'available' ? 'Disponible' : 'Indisponible'}
            </Badge>
            {activeMandate && (
              <Badge variant="outline">
                Mandat actif
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.address}, {property.city}
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
            <div className="text-right text-xs text-muted-foreground">
              <p>Propriétaire: {property.owner_profile?.full_name}</p>
              {activeMandate && (
                <p>Mandat: {activeMandate.mandate_type}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Détails
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteProperty(property.id)}
            >
              <Trash2 className="h-4 w-4" />
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

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              Biens gérés
            </h1>
            <p className="text-muted-foreground">
              Gérez les propriétés confiées par vos clients
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle propriété</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle propriété à gérer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre de l'annonce</Label>
                    <Input
                      id="title"
                      value={newProperty.title}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Bel appartement à Cocody"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={newProperty.address}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rue des Jardins, 2 Plateau"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Select value={newProperty.city} onValueChange={(value) => setNewProperty(prev => ({ ...prev, city: value, neighborhood: '' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une ville" />
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
                    <Label htmlFor="neighborhood">Quartier</Label>
                    <Select
                      value={newProperty.neighborhood}
                      onValueChange={(value) => setNewProperty(prev => ({ ...prev, neighborhood: value }))}
                      disabled={!newProperty.city}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {(NEIGHBORHOODS[newProperty.city as keyof typeof NEIGHBORHOODS] || NEIGHBORHOODS.default).map(neighborhood => (
                          <SelectItem key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProperty.description}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez la propriété, ses atouts, l'environnement..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyType">Type de bien</Label>
                    <Select value={newProperty.property_type} onValueChange={(value) => setNewProperty(prev => ({ ...prev, property_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROPERTY_TYPES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surfaceArea">Surface (m²)</Label>
                    <Input
                      id="surfaceArea"
                      type="number"
                      value={newProperty.surface_area}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, surface_area: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Chambres</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={newProperty.bedrooms}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Salles de bain</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={newProperty.bathrooms}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, bathrooms: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyRent">Loyer mensuel (FCFA)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={newProperty.monthly_rent}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, monthly_rent: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="depositAmount">Dépôt de garantie (FCFA)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={newProperty.deposit_amount}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="chargesAmount">Charges (FCFA)</Label>
                    <Input
                      id="chargesAmount"
                      type="number"
                      value={newProperty.charges_amount}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, charges_amount: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="furnished"
                      checked={newProperty.furnished}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, furnished: e.target.checked }))}
                    />
                    <label htmlFor="furnished" className="text-sm">Meublé</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="availableImmediately"
                      checked={newProperty.available_immediately}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, available_immediately: e.target.checked }))}
                    />
                    <label htmlFor="availableImmediately" className="text-sm">Disponible immédiatement</label>
                  </div>
                </div>

                {!newProperty.available_immediately && (
                  <div>
                    <Label htmlFor="availableFrom">Date de disponibilité</Label>
                    <Input
                      id="availableFrom"
                      type="date"
                      value={newProperty.available_from}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, available_from: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={createProperty} disabled={loading}>
                    {loading ? 'Création...' : 'Ajouter la propriété'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre, description, adresse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="available">Disponibles</SelectItem>
                    <SelectItem value="rented">Loués</SelectItem>
                    <SelectItem value="unavailable">Indisponibles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des propriétés */}
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun bien géré</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de biens à gérer
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bien
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}