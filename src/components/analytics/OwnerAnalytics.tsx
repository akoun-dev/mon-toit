import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  DollarSign,
  Users,
  Home,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';

interface PropertyStats {
  id: string;
  title: string;
  views: number;
  favorites: number;
  inquiries: number;
  applications: number;
  conversionRate: number;
  averageResponseTime: number;
  lastViewDate: string;
  status: 'published' | 'draft' | 'rented';
  monthlyViews: number;
  monthlyInquiries: number;
  monthlyApplications: number;
}

interface AnalyticsData {
  totalProperties: number;
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
  totalApplications: number;
  averageConversionRate: number;
  totalRevenue: number;
  occupiedProperties: number;
  vacantProperties: number;
  propertyStats: PropertyStats[];
  monthlyTrends: {
    month: string;
    views: number;
    inquiries: number;
    applications: number;
    revenue: number;
  }[];
  topPerformingProperties: PropertyStats[];
  demographics: {
    ageGroups: Record<string, number>;
    sourceTypes: Record<string, number>;
    peakHours: Record<string, number>;
  };
}

interface OwnerAnalyticsProps {
  ownerId?: string;
  className?: string;
}

const OwnerAnalytics: React.FC<OwnerAnalyticsProps> = ({
  ownerId,
  className
}) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, ownerId, dateRange, selectedProperty]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const targetOwnerId = ownerId || user?.id;

      // Fetch properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, status, created_at, owner_id')
        .eq('owner_id', targetOwnerId);

      if (propertiesError) throw propertiesError;

      // Fetch property views
      const { data: views, error: viewsError } = await supabase
        .from('property_views')
        .select('property_id, viewed_at, viewer_id, ip_address, user_agent')
        .in('property_id', properties?.map(p => p.id) || [])
        .gte('viewed_at', dateRange.from.toISOString())
        .lte('viewed_at', dateRange.to.toISOString());

      if (viewsError) throw viewsError;

      // Fetch favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('property_id, user_id, created_at')
        .in('property_id', properties?.map(p => p.id) || [])
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (favoritesError) throw favoritesError;

      // Fetch applications
      const { data: applications, error: applicationsError } = await supabase
        .from('rental_applications')
        .select('property_id, created_at, status, tenant_id')
        .in('property_id', properties?.map(p => p.id) || [])
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (applicationsError) throw applicationsError;

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('property_id, created_at, sender_id, receiver_id')
        .in('property_id', properties?.map(p => p.id) || [])
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (messagesError) throw messagesError;

      // Fetch leases for revenue calculation
      const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('monthly_rent, status, start_date, end_date')
        .in('property_id', properties?.map(p => p.id) || []);

      if (leasesError) throw leasesError;

      // Process analytics data
      const processedData = processAnalyticsData(
        properties || [],
        views || [],
        favorites || [],
        applications || [],
        messages || [],
        leases || [],
        dateRange
      );

      setAnalytics(processedData);

    } catch (error) {
      logger.error('Error fetching analytics', { error, userId: user?.id });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    properties: any[],
    views: any[],
    favorites: any[],
    applications: any[],
    messages: any[],
    leases: any[],
    dateRange: { from: Date; to: Date }
  ): AnalyticsData => {
    // Property-level stats
    const propertyStats: PropertyStats[] = properties.map(property => {
      const propertyViews = views.filter(v => v.property_id === property.id);
      const propertyFavorites = favorites.filter(f => f.property_id === property.id);
      const propertyApplications = applications.filter(a => a.property_id === property.id);
      const propertyMessages = messages.filter(m => m.property_id === property.id);
      const propertyLeases = leases.filter(l => l.property_id === property.id);

      const uniqueViewers = new Set(propertyViews.map(v => v.viewer_id)).size;
      const uniqueInquiries = new Set([
        ...propertyApplications.map(a => a.tenant_id),
        ...propertyMessages.map(m => m.sender_id)
      ]).size;

      const conversionRate = uniqueViewers > 0 ? (propertyApplications.length / uniqueViewers) * 100 : 0;

      // Calculate average response time (mock data)
      const averageResponseTime = 2.5; // hours

      return {
        id: property.id,
        title: property.title,
        views: propertyViews.length,
        favorites: propertyFavorites.length,
        inquiries: uniqueInquiries,
        applications: propertyApplications.length,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        averageResponseTime,
        lastViewDate: propertyViews.length > 0 ? propertyViews[propertyViews.length - 1].viewed_at : '',
        status: property.status,
        monthlyViews: propertyViews.length,
        monthlyInquiries: uniqueInquiries,
        monthlyApplications: propertyApplications.length
      };
    });

    // Aggregate stats
    const totalViews = propertyStats.reduce((sum, p) => sum + p.views, 0);
    const totalFavorites = propertyStats.reduce((sum, p) => sum + p.favorites, 0);
    const totalInquiries = propertyStats.reduce((sum, p) => sum + p.inquiries, 0);
    const totalApplications = propertyStats.reduce((sum, p) => sum + p.applications, 0);
    const averageConversionRate = propertyStats.length > 0
      ? propertyStats.reduce((sum, p) => sum + p.conversionRate, 0) / propertyStats.length
      : 0;

    // Revenue calculation
    const activeLeases = leases.filter(l => l.status === 'active');
    const totalRevenue = activeLeases.reduce((sum, lease) => sum + lease.monthly_rent, 0);

    // Occupancy stats
    const occupiedProperties = activeLeases.length;
    const vacantProperties = properties.length - occupiedProperties;

    // Top performing properties
    const topPerformingProperties = [...propertyStats]
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // Mock trends data
    const monthlyTrends = generateMonthlyTrends(dateRange);

    // Mock demographics
    const demographics = {
      ageGroups: {
        '18-25': 15,
        '26-35': 35,
        '36-45': 30,
        '46-55': 15,
        '55+': 5
      },
      sourceTypes: {
        'Recherche directe': 40,
        'Favoris': 25,
        'Recommandations': 20,
        'Réseaux sociaux': 10,
        'Autres': 5
      },
      peakHours: {
        '9h-12h': 25,
        '12h-15h': 35,
        '15h-18h': 30,
        '18h-21h': 10
      }
    };

    return {
      totalProperties: properties.length,
      totalViews,
      totalFavorites,
      totalInquiries,
      totalApplications,
      averageConversionRate: parseFloat(averageConversionRate.toFixed(2)),
      totalRevenue,
      occupiedProperties,
      vacantProperties,
      propertyStats,
      monthlyTrends,
      topPerformingProperties,
      demographics
    };
  };

  const generateMonthlyTrends = (dateRange: { from: Date; to: Date }) => {
    const trends = [];
    const current = new Date(dateRange.from);

    while (current <= dateRange.to) {
      trends.push({
        month: current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        views: Math.floor(Math.random() * 1000) + 500,
        inquiries: Math.floor(Math.random() * 100) + 50,
        applications: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 1000000) + 500000
      });
      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  };

  const exportData = () => {
    if (!analytics) return;

    const csvContent = [
      ['Bien', 'Vues', 'Favoris', 'Demandes', 'Candidatures', 'Taux conversion', 'Statut'],
      ...analytics.propertyStats.map(property => [
        property.title,
        property.views.toString(),
        property.favorites.toString(),
        property.inquiries.toString(),
        property.applications.toString(),
        `${property.conversionRate}%`,
        property.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Impossible de charger les analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tableau de Bord Analytique
              </CardTitle>
              <CardDescription>
                Suivez les performances de vos biens immobiliers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les biens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les biens</SelectItem>
                  {analytics.propertyStats.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="properties">Biens</TabsTrigger>
              <TabsTrigger value="trends">Tendances</TabsTrigger>
              <TabsTrigger value="demographics">Démographie</TabsTrigger>
              <TabsTrigger value="revenue">Revenus</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Vues totales</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-muted-foreground">Favoris</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.totalFavorites.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Candidatures</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.totalApplications}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">Taux conversion</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.averageConversionRate}%</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2% ce mois
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Occupancy Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Biens occupés</p>
                        <p className="text-xl font-bold">{analytics.occupiedProperties}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <Progress
                      value={(analytics.occupiedProperties / analytics.totalProperties) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Biens vacants</p>
                        <p className="text-xl font-bold">{analytics.vacantProperties}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <Progress
                      value={(analytics.vacantProperties / analytics.totalProperties) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenus mensuels</p>
                        <p className="text-xl font-bold">
                          {analytics.totalRevenue.toLocaleString()} FCFA
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-4">
              <div className="space-y-4">
                {analytics.propertyStats
                  .filter(property => selectedProperty === 'all' || property.id === selectedProperty)
                  .map((property) => (
                    <Card key={property.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{property.title}</h3>
                            <Badge variant={property.status === 'published' ? 'default' : 'secondary'}>
                              {property.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Taux conversion</p>
                            <p className="text-xl font-bold">{property.conversionRate}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-muted-foreground">Vues</p>
                              <p className="font-semibold">{property.views}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-muted-foreground">Favoris</p>
                              <p className="font-semibold">{property.favorites}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-muted-foreground">Demandes</p>
                              <p className="font-semibold">{property.inquiries}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-muted-foreground">Candidatures</p>
                              <p className="font-semibold">{property.applications}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyTrends.map((trend) => (
                      <div key={trend.month} className="space-y-2">
                        <p className="font-semibold">{trend.month}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Vues</p>
                            <p className="font-semibold">{trend.views.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Demandes</p>
                            <p className="font-semibold">{trend.inquiries}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Candidatures</p>
                            <p className="font-semibold">{trend.applications}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Revenus</p>
                            <p className="font-semibold">{trend.revenue.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demographics Tab */}
            <TabsContent value="demographics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Groupes d'âge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.demographics.ageGroups).map(([age, count]) => (
                        <div key={age} className="flex items-center justify-between">
                          <span className="text-sm">{age}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(count / Object.values(analytics.demographics.ageGroups).reduce((a, b) => a + b, 0)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sources des visites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.demographics.sourceTypes).map(([source, count]) => (
                        <div key={source} className="flex items-center justify-between">
                          <span className="text-sm">{source}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${count}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Heures de pointe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.demographics.peakHours).map(([hour, count]) => (
                        <div key={hour} className="flex items-center justify-between">
                          <span className="text-sm">{hour}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${count}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus mensuels</CardTitle>
                  <CardDescription>
                    Revenus générés par vos biens immobiliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <p className="text-4xl font-bold text-green-600">
                      {analytics.totalRevenue.toLocaleString()} FCFA
                    </p>
                    <p className="text-muted-foreground">
                      Total mensuel • {analytics.occupiedProperties} biens occupés
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Loyer moyen</p>
                        <p className="text-lg font-semibold">
                          {analytics.totalRevenue > 0 && analytics.occupiedProperties > 0
                            ? Math.round(analytics.totalRevenue / analytics.occupiedProperties).toLocaleString()
                            : 0} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taux d'occupation</p>
                        <p className="text-lg font-semibold">
                          {Math.round((analytics.occupiedProperties / analytics.totalProperties) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenus annuels estimés</p>
                        <p className="text-lg font-semibold">
                          {(analytics.totalRevenue * 12).toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Biens actifs</p>
                        <p className="text-lg font-semibold">{analytics.occupiedProperties}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerAnalytics;