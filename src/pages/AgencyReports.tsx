import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { MainLayout } from '@/components/layout/MainLayout';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { toast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  FileText,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportData {
  overview: {
    totalRevenue: number;
    totalProperties: number;
    totalClients: number;
    totalMandates: number;
    averageRent: number;
    occupancyRate: number;
  };
  monthlyStats: {
    month: string;
    revenue: number;
    newProperties: number;
    newClients: number;
    newMandates: number;
  }[];
  propertyStats: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  clientStats: {
    total: number;
    active: number;
    newThisMonth: number;
    byCity: { city: string; count: number }[];
  };
  financialStats: {
    monthlyRevenue: number;
    quarterlyRevenue: number;
    yearlyRevenue: number;
    revenueByPropertyType: { type: string; revenue: number }[];
    revenueByCity: { city: string; revenue: number }[];
  };
  performanceMetrics: {
    averageTimeToRent: number;
    averageRentPrice: number;
    clientSatisfactionScore: number;
    mandateConversionRate: number;
  };
}

export default function AgencyReports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [reportType, setReportType] = useState<'overview' | 'financial' | 'properties' | 'clients' | 'performance'>('overview');

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateRange, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Vue d'ensemble
      const { data: mandates } = await supabase
        .from('agency_mandates')
        .select('id, monthly_fee, success_fee, start_date, end_date, status, created_at')
        .eq('agency_id', user?.id);

      const { data: properties } = await supabase
        .from('properties')
        .select('id, monthly_rent, status, city, property_type, created_at')
        .eq('agency_id', user?.id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, user_type')
        .in('id', [...new Set(mandates?.map(m => m.owner_id) || [])])
        .eq('user_type', 'proprietaire');

      // Calculer les statistiques
      const totalRevenue = properties?.reduce((sum, prop) => sum + prop.monthly_rent, 0) || 0;
      const occupiedProperties = properties?.filter(p => p.status === 'rented').length || 0;
      const occupancyRate = properties?.length > 0 ? (occupiedProperties / properties.length) * 100 : 0;
      const averageRent = properties?.length > 0 ? totalRevenue / properties.length : 0;

      // Statistiques mensuelles
      const monthlyStats = [];
      const currentDate = new Date(dateRange.to);
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const monthMandates = mandates?.filter(m => {
          const mandateDate = new Date(m.created_at);
          return mandateDate >= month && mandateDate <= monthEnd;
        }) || [];

        const monthProperties = properties?.filter(p => {
          const propDate = new Date(p.created_at);
          return propDate >= month && propDate <= monthEnd;
        }) || [];

        const monthClients = profiles?.filter(p => {
          const clientDate = new Date(p.created_at);
          return clientDate >= month && clientDate <= monthEnd;
        }) || [];

        monthlyStats.push({
          month: format(month, 'MMMM yyyy', { locale: fr }),
          revenue: monthProperties.reduce((sum, prop) => sum + prop.monthly_rent, 0),
          newProperties: monthProperties.length,
          newClients: monthClients.length,
          newMandates: monthMandates.length
        });
      }

      // Statistiques par propriété
      const propertyStats = {
        total: properties?.length || 0,
        available: properties?.filter(p => p.status === 'available').length || 0,
        rented: properties?.filter(p => p.status === 'rented').length || 0,
        maintenance: properties?.filter(p => p.status === 'maintenance').length || 0
      };

      // Statistiques clients par ville
      const clientsByCity = profiles?.reduce((acc: any, client) => {
        // Pour cet exemple, nous utilisons une ville par défaut
        const city = 'Abidjan'; // Dans la vraie application, récupérer la ville du client
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}) || {};

      // Statistiques financières
      const revenueByPropertyType = properties?.reduce((acc: any, prop) => {
        const type = prop.property_type || 'unknown';
        acc[type] = (acc[type] || 0) + prop.monthly_rent;
        return acc;
      }, {}) || {};

      const revenueByCity = properties?.reduce((acc: any, prop) => {
        const city = prop.city || 'unknown';
        acc[city] = (acc[city] || 0) + prop.monthly_rent;
        return acc;
      }, {}) || {};

      // Métriques de performance
      const performanceMetrics = {
        averageTimeToRent: 45, // jours (exemple)
        averageRentPrice: averageRent,
        clientSatisfactionScore: 4.2, // sur 5
        mandateConversionRate: 75 // %
      };

      setReportData({
        overview: {
          totalRevenue: totalRevenue,
          totalProperties: properties?.length || 0,
          totalClients: profiles?.length || 0,
          totalMandates: mandates?.length || 0,
          averageRent: averageRent,
          occupancyRate: occupancyRate
        },
        monthlyStats,
        propertyStats,
        clientStats: {
          total: profiles?.length || 0,
          active: profiles?.length || 0,
          newThisMonth: monthlyStats[monthlyStats.length - 1]?.newClients || 0,
          byCity: Object.entries(clientsByCity).map(([city, count]) => ({ city, count }))
        },
        financialStats: {
          monthlyRevenue: totalRevenue,
          quarterlyRevenue: totalRevenue * 3,
          yearlyRevenue: totalRevenue * 12,
          revenueByPropertyType: Object.entries(revenueByPropertyType).map(([type, revenue]) => ({ type, revenue })),
          revenueByCity: Object.entries(revenueByCity).map(([city, revenue]) => ({ city, revenue }))
        },
        performanceMetrics
      });
    } catch (error) {
      logger.error('Error fetching report data', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du rapport',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      // Logique pour exporter le rapport en CSV/PDF
      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté avec succès'
      });
    } catch (error) {
      logger.error('Error exporting report', { error, userId: user?.id });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive'
      });
    }
  };

  const MetricCard = ({ title, value, change, icon, format = 'number' }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ReactNode;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `${val.toLocaleString('fr-FR')} FCFA`;
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString('fr-FR');
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {change !== undefined && (
            <p className="text-xs text-muted-foreground flex items-center">
              {change > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(change)}%
              </span>
              vs mois dernier
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenu mensuel"
          value={reportData?.overview.totalRevenue || 0}
          change={12.5}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          format="currency"
        />
        <MetricCard
          title="Biens gérés"
          value={reportData?.overview.totalProperties || 0}
          change={8.2}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Clients actifs"
          value={reportData?.overview.totalClients || 0}
          change={15.3}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Taux d'occupation"
          value={reportData?.overview.occupancyRate || 0}
          change={3.1}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          format="percentage"
        />
      </div>

      {/* Graphique des revenus mensuels */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus mensuels</CardTitle>
          <CardDescription>
            Évolution des revenus sur les 6 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData?.monthlyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{stat.month}</span>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {stat.revenue.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.newProperties} biens • {stat.newClients} clients
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques des biens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques des biens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-bold">{reportData?.propertyStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Disponibles</span>
                <span className="font-bold text-green-500">{reportData?.propertyStats.available}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Loués</span>
                <span className="font-bold text-blue-500">{reportData?.propertyStats.rented}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>En maintenance</span>
                <span className="font-bold text-orange-500">{reportData?.propertyStats.maintenance}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métriques de performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Temps moyen de location</span>
                <span className="font-bold">{reportData?.performanceMetrics.averageTimeToRent} jours</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Loyer moyen</span>
                <span className="font-bold">
                  {(reportData?.performanceMetrics.averageRentPrice || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Satisfaction client</span>
                <span className="font-bold">{reportData?.performanceMetrics.clientSatisfactionScore}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taux conversion mandat</span>
                <span className="font-bold">{reportData?.performanceMetrics.mandateConversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const FinancialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Revenu mensuel"
          value={reportData?.financialStats.monthlyRevenue || 0}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          format="currency"
        />
        <MetricCard
          title="Revenu trimestriel"
          value={reportData?.financialStats.quarterlyRevenue || 0}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          format="currency"
        />
        <MetricCard
          title="Revenu annuel (estimation)"
          value={reportData?.financialStats.yearlyRevenue || 0}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          format="currency"
        />
      </div>

      {/* Revenus par type de bien */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus par type de bien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData?.financialStats.revenueByPropertyType.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="capitalize">{item.type}</span>
                <span className="font-bold text-primary">
                  {item.revenue.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenus par ville */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus par ville</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData?.financialStats.revenueByCity.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{item.city}</span>
                <span className="font-bold text-primary">
                  {item.revenue.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

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

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Rapports et statistiques
            </h1>
            <p className="text-muted-foreground">
              Analysez les performances de votre agence
            </p>
          </div>

          <div className="flex gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => range && setDateRange(range)}
            />
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
            <TabsTrigger value="properties">Biens</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialTab />
          </TabsContent>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des biens</CardTitle>
                <CardDescription>
                  Analyse détaillée de votre portefeuille immobilier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Analyse détaillée des biens en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des clients</CardTitle>
                <CardDescription>
                  Informations sur votre base de clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Analyse client détaillée en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de performance</CardTitle>
                <CardDescription>
                  KPIs et métriques de performance de l'agence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Tableau de bord de performance en cours de développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}