import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  MapPin,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';

interface CityStats {
  city: string;
  total: number;
  available: number;
  rented: number;
  occupancyRate: number;
  avgRent: number;
  totalRevenue: number;
}

interface NeighborhoodRevenue {
  neighborhood: string;
  city: string;
  revenue: number;
  properties: number;
  actualRevenue: number;
}

interface OccupancyTrend {
  date: string;
  occupied: number;
  available: number;
  rate: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const RealtimeDashboard = () => {
  const [citiesData, setCitiesData] = useState<CityStats[]>([]);
  const [neighborhoodRevenue, setNeighborhoodRevenue] = useState<NeighborhoodRevenue[]>([]);
  const [occupancyTrend, setOccupancyTrend] = useState<OccupancyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [period, setPeriod] = useState('30');
  const { toast } = useToast();

  const globalStats = useMemo(() => {
    const totalProperties = citiesData.reduce((sum, city) => sum + city.total, 0);
    const rentedProperties = citiesData.reduce((sum, city) => sum + city.rented, 0);
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;
    const totalRevenue = citiesData.reduce((sum, city) => sum + city.totalRevenue, 0);
    const actualRevenue = citiesData.reduce((sum, city) => sum + (city.rented * city.avgRent), 0);
    
    return {
      totalProperties,
      rentedProperties,
      occupancyRate,
      totalRevenue,
      actualRevenue,
      topCity: citiesData[0]?.city || '-',
      topCityProperties: citiesData[0]?.total || 0
    };
  }, [citiesData]);

  const occupancyPieData = useMemo(() => [
    { name: 'Louées', value: globalStats.rentedProperties },
    { name: 'Disponibles', value: globalStats.totalProperties - globalStats.rentedProperties }
  ], [globalStats]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch cities statistics
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('city, status, monthly_rent')
        .eq('moderation_status', 'approved');

      if (propError) throw propError;

      // Group by city
      const cityMap = new Map<string, { total: number; rented: number; rents: number[] }>();
      
      properties?.forEach((prop) => {
        const city = prop.city || 'Non spécifié';
        if (!cityMap.has(city)) {
          cityMap.set(city, { total: 0, rented: 0, rents: [] });
        }
        const stats = cityMap.get(city)!;
        stats.total++;
        if (prop.status === 'loue') stats.rented++;
        stats.rents.push(Number(prop.monthly_rent) || 0);
      });

      const citiesStats: CityStats[] = Array.from(cityMap.entries()).map(([city, stats]) => {
        const avgRent = stats.rents.reduce((a, b) => a + b, 0) / stats.rents.length;
        return {
          city,
          total: stats.total,
          available: stats.total - stats.rented,
          rented: stats.rented,
          occupancyRate: stats.total > 0 ? (stats.rented / stats.total) * 100 : 0,
          avgRent,
          totalRevenue: stats.total * avgRent
        };
      }).sort((a, b) => b.total - a.total);

      setCitiesData(citiesStats);

      // Fetch neighborhood revenue
      const { data: propsWithNeighborhood, error: neighError } = await supabase
        .from('properties')
        .select('city, neighborhood, status, monthly_rent')
        .eq('moderation_status', 'approved')
        .not('neighborhood', 'is', null);

      if (neighError) throw neighError;

      const neighMap = new Map<string, { city: string; revenue: number; properties: number; actualRevenue: number }>();
      
      propsWithNeighborhood?.forEach((prop) => {
        const key = `${prop.city}-${prop.neighborhood}`;
        if (!neighMap.has(key)) {
          neighMap.set(key, { 
            city: prop.city, 
            revenue: 0, 
            properties: 0, 
            actualRevenue: 0 
          });
        }
        const stats = neighMap.get(key)!;
        stats.properties++;
        const rent = Number(prop.monthly_rent) || 0;
        stats.revenue += rent;
        if (prop.status === 'loue') {
          stats.actualRevenue += rent;
        }
      });

      const neighRevenue: NeighborhoodRevenue[] = Array.from(neighMap.entries())
        .map(([key, stats]) => ({
          neighborhood: key.split('-')[1],
          city: stats.city,
          revenue: stats.revenue,
          properties: stats.properties,
          actualRevenue: stats.actualRevenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);

      setNeighborhoodRevenue(neighRevenue);

      // Generate occupancy trend (mock data for demonstration)
      const days = parseInt(period);
      const trend: OccupancyTrend[] = [];
      const currentRate = globalStats.occupancyRate || 50;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = Math.random() * 10 - 5;
        const rate = Math.max(0, Math.min(100, currentRate + variation));
        const total = globalStats.totalProperties || 100;
        const occupied = Math.round((rate / 100) * total);
        
        trend.push({
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          occupied,
          available: total - occupied,
          rate: Number(rate.toFixed(1))
        });
      }

      setOccupancyTrend(trend);
      setLastUpdate(new Date());

    } catch (error) {
      logger.error('Failed to fetch dashboard data', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties'
        },
        () => {
          setLastUpdate(new Date());
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leases'
        },
        () => {
          setLastUpdate(new Date());
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);

  const exportToCSV = () => {
    const csvContent = [
      ['Ville', 'Total', 'Disponibles', 'Louées', 'Taux occupation', 'Loyer moyen', 'Revenus totaux'],
      ...citiesData.map(city => [
        city.city,
        city.total,
        city.available,
        city.rented,
        `${city.occupancyRate.toFixed(1)}%`,
        `${city.avgRent.toLocaleString()} FCFA`,
        `${city.totalRevenue.toLocaleString()} FCFA`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: "Les données ont été exportées en CSV"
    });
  };

  if (loading && citiesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Dashboard Temps Réel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Period filters */}
          <div className="flex gap-1">
            {['7', '30', '90', '365'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === '365' ? '1an' : `${p}j`}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Taux d'occupation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats.rentedProperties} / {globalStats.totalProperties} propriétés louées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Revenus potentiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(globalStats.totalRevenue / 1000000).toFixed(1)}M FCFA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenus mensuels théoriques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Revenus actuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(globalStats.actualRevenue / 1000000).toFixed(1)}M FCFA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Propriétés louées uniquement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Ville top
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.topCity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats.topCityProperties} propriétés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cities">Villes</TabsTrigger>
          <TabsTrigger value="occupancy">Occupation</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="trend">Évolution</TabsTrigger>
        </TabsList>

        {/* Properties by City */}
        <TabsContent value="cities">
          <Card>
            <CardHeader>
              <CardTitle>Propriétés par ville</CardTitle>
              <CardDescription>
                Répartition des propriétés totales, disponibles et louées par ville
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={citiesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="city" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill={CHART_COLORS[0]} name="Total" />
                  <Bar dataKey="available" fill={CHART_COLORS[1]} name="Disponibles" />
                  <Bar dataKey="rented" fill={CHART_COLORS[2]} name="Louées" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Occupancy Rate */}
        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Taux d'occupation global</CardTitle>
              <CardDescription>
                Répartition entre propriétés louées et disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {occupancyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue by Neighborhood */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Top 15 quartiers par revenus</CardTitle>
              <CardDescription>
                Revenus mensuels potentiels et actuels par quartier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={neighborhoodRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="neighborhood" 
                    type="category" 
                    width={120}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString()} FCFA`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill={CHART_COLORS[0]} name="Revenus potentiels" />
                  <Bar dataKey="actualRevenue" fill={CHART_COLORS[2]} name="Revenus actuels" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Occupancy Trend */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du taux d'occupation</CardTitle>
              <CardDescription>
                Taux d'occupation sur les {period} derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={occupancyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Taux d\'occupation (%)') {
                        return [`${value}%`, name];
                      }
                      return [value, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke={CHART_COLORS[0]} 
                    strokeWidth={2}
                    name="Taux d'occupation (%)"
                    dot={{ fill: CHART_COLORS[0] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
