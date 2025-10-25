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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building,
  DollarSign,
  Star,
  Filter,
  Search,
  UserCheck,
  UserX,
  MapPin
} from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: string;
  is_verified: boolean;
  oneci_verified: boolean;
  created_at: string;
  last_login: string | null;
  properties_count: number;
  active_mandates_count: number;
  total_properties_value: number;
  average_rating: number | null;
  total_revenue: number;
  address?: string;
  city?: string;
  preferences?: {
    communication_method: string;
    contact_frequency: string;
    preferred_properties: string[];
  };
}

interface ClientStats {
  total_clients: number;
  active_clients: number;
  new_clients_month: number;
  total_properties: number;
  total_mandates: number;
  average_properties_per_client: number;
  top_clients: Client[];
}

export default function AgencyClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchClientStats();
    }
  }, [user, searchQuery, statusFilter, sortBy]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Récupérer les propriétaires liés à l'agence via les mandats
      const { data: mandates } = await supabase
        .from('agency_mandates')
        .select('owner_id')
        .eq('agency_id', user?.id)
        .eq('status', 'active');

      if (!mandates || mandates.length === 0) {
        setClients([]);
        return;
      }

      const ownerIds = [...new Set(mandates.map(m => m.owner_id))];

      // Récupérer les informations des clients (propriétaires)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          properties:owner_id(count),
          agency_mandates:owner_id(count)
        `)
        .in('id', ownerIds)
        .eq('user_type', 'proprietaire');

      if (error) throw error;

      // Enrichir les données avec les statistiques
      const enrichedClients = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          // Récupérer les propriétés du client
          const { data: properties } = await supabase
            .from('properties')
            .select('id, monthly_rent, city, neighborhood')
            .eq('owner_id', profile.id);

          // Calculer les statistiques
          const propertiesCount = properties?.length || 0;
          const totalPropertiesValue = properties?.reduce((sum, prop) => sum + prop.monthly_rent, 0) || 0;
          const activeMandatesCount = mandates.filter(m => m.owner_id === profile.id).length;

          // Récupérer la moyenne des notes (si disponible)
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('target_id', profile.id);

          const averageRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

          return {
            ...profile,
            properties_count: propertiesCount,
            active_mandates_count: activeMandatesCount,
            total_properties_value: totalPropertiesValue,
            average_rating: averageRating,
            total_revenue: totalPropertiesValue * 12 // Approximation annuelle
          };
        })
      );

      // Appliquer les filtres
      let filteredClients = enrichedClients;

      if (statusFilter === 'verified') {
        filteredClients = filteredClients.filter(client => client.is_verified);
      } else if (statusFilter === 'unverified') {
        filteredClients = filteredClients.filter(client => !client.is_verified);
      }

      // Appliquer la recherche
      if (searchQuery) {
        filteredClients = filteredClients.filter(client =>
          client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone?.includes(searchQuery)
        );
      }

      // Appliquer le tri
      filteredClients.sort((a, b) => {
        switch (sortBy) {
          case 'full_name':
            return a.full_name.localeCompare(b.full_name);
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'properties_count':
            return b.properties_count - a.properties_count;
          case 'total_properties_value':
            return b.total_properties_value - a.total_properties_value;
          default:
            return 0;
        }
      });

      setClients(filteredClients);
    } catch (error) {
      logger.error('Error fetching clients', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clients',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientStats = async () => {
    try {
      // Statistiques globales
      const { data: mandates } = await supabase
        .from('agency_mandates')
        .select('owner_id, created_at')
        .eq('agency_id', user?.id);

      const uniqueOwners = [...new Set(mandates?.map(m => m.owner_id) || [])];
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const newClientsThisMonth = mandates?.filter(m =>
        new Date(m.created_at) > oneMonthAgo
      ).map(m => m.owner_id).filter((owner, index, arr) => arr.indexOf(owner) === index).length || 0;

      // Top clients
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at')
        .in('id', uniqueOwners.slice(0, 5));

      const topClients = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: properties } = await supabase
            .from('properties')
            .select('monthly_rent')
            .eq('owner_id', profile.id);

          const totalValue = properties?.reduce((sum, prop) => sum + prop.monthly_rent, 0) || 0;

          return {
            ...profile,
            total_properties_value: totalValue,
            properties_count: properties?.length || 0
          };
        })
      );

      setStats({
        total_clients: uniqueOwners.length,
        active_clients: uniqueOwners.length,
        new_clients_month: newClientsThisMonth,
        total_properties: mandates?.length || 0,
        total_mandates: mandates?.length || 0,
        average_properties_per_client: uniqueOwners.length > 0 ? (mandates?.length || 0) / uniqueOwners.length : 0,
        top_clients: topClients.sort((a, b) => b.total_properties_value - a.total_properties_value)
      });
    } catch (error) {
      logger.error('Error fetching client stats', { error, userId: user?.id });
    }
  };

  const updateClientVerification = async (clientId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: verified })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `Le client est maintenant ${verified ? 'vérifié' : 'non vérifié'}`
      });

      fetchClients();
    } catch (error) {
      logger.error('Error updating client verification', { error, userId: user?.id, clientId });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const sendClientNotification = async (clientId: string, message: string) => {
    try {
      // Logique pour envoyer une notification au client
      toast({
        title: 'Notification envoyée',
        description: 'La notification a été envoyée au client'
      });
    } catch (error) {
      logger.error('Error sending client notification', { error, userId: user?.id, clientId });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la notification',
        variant: 'destructive'
      });
    }
  };

  const ClientCard = ({ client }: { client: Client }) => {
    const isRecentlyActive = client.last_login &&
      new Date(client.last_login).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{client.full_name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={client.is_verified ? 'default' : 'secondary'}>
                    {client.is_verified ? (
                      <><UserCheck className="h-3 w-3 mr-1" />Vérifié</>
                    ) : (
                      <><UserX className="h-3 w-3 mr-1" />Non vérifié</>
                    )}
                  </Badge>
                  {isRecentlyActive && (
                    <Badge variant="outline" className="text-xs">
                      Actif récemment
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {client.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.city}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Statistiques</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>{client.properties_count} bien{client.properties_count > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span>{client.total_properties_value.toLocaleString()} FCFA/mois</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span>{client.active_mandates_count} mandat{client.active_mandates_count > 1 ? 's' : ''}</span>
                </div>
                {client.average_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{client.average_rating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => updateClientVerification(client.id, !client.is_verified)}
              >
                {client.is_verified ? 'Révoquer la vérification' : 'Vérifier le client'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendClientNotification(client.id, 'Nouveaux biens disponibles')}
              >
                Contacter
              </Button>
            </div>
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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mes clients
          </h1>
          <p className="text-muted-foreground">
            Gérez vos clients propriétaires et suivez leurs portefeuilles
          </p>
        </div>

        {/* Statistiques globales */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_clients}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.new_clients_month} ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Biens gérés</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_properties}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.average_properties_per_client.toFixed(1)} par client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mandats actifs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_mandates}</div>
                <p className="text-xs text-muted-foreground">
                  Portefeuille global
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valeur portefeuille</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.top_clients.reduce((sum, client) => sum + client.total_properties_value, 0).toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  Par mois
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email, téléphone..."
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
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="verified">Vérifiés</SelectItem>
                    <SelectItem value="unverified">Non vérifiés</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Plus récents</SelectItem>
                    <SelectItem value="full_name">Nom (A-Z)</SelectItem>
                    <SelectItem value="properties_count">Plus de biens</SelectItem>
                    <SelectItem value="total_properties_value">Plus grande valeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top clients */}
        {stats && stats.top_clients.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Top clients</CardTitle>
              <CardDescription>
                Vos clients les plus valorisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_clients.slice(0, 5).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.properties_count} bien{client.properties_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {client.total_properties_value.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">par mois</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des clients */}
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun client</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore de clients propriétaires
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}