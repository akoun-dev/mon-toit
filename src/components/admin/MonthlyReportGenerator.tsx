import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Mail,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Send,
  Globe,
  Target
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyReport {
  id: string;
  month: string;
  year: number;
  status: 'draft' | 'generated' | 'sent' | 'failed';
  generated_at?: string;
  sent_at?: string;
  pdf_url?: string;
  csv_url?: string;
  recipients: string[];
  metrics: {
    total_users: number;
    active_users: number;
    new_users: number;
    total_properties: number;
    new_properties: number;
    total_applications: number;
    successful_applications: number;
    conversion_rate: number;
    avg_monthly_rent: number;
    total_rent_value: number;
    user_growth_rate: number;
    property_growth_rate: number;
    region_breakdown: Record<string, number>;
    user_type_breakdown: Record<string, number>;
  };
  comparison: {
    previous_month_metrics: Record<string, number>;
    month_over_month_growth: Record<string, number>;
    year_over_year_growth: Record<string, number>;
  };
  created_at: string;
  updated_at: string;
}

interface ReportMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    growth_rate: number;
  };
  properties: {
    total: number;
    new: number;
    avg_rent: number;
    total_value: number;
    growth_rate: number;
  };
  applications: {
    total: number;
    successful: number;
    conversion_rate: number;
  };
  platform: {
    page_views: number;
    unique_visitors: number;
    avg_session_duration: number;
    bounce_rate: number;
  };
}

export const MonthlyReportGenerator = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [currentMetrics, setCurrentMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
    fetchCurrentMetrics();
  }, [selectedMonth]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      logger.error('Error fetching monthly reports', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports mensuels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMetrics = async () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Récupérer les métriques via une fonction RPC
      const { data, error } = await supabase.rpc('get_monthly_report_metrics', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) {
        // Calculer manuellement si la fonction n'existe pas
        await calculateManualMetrics();
        return;
      }

      setCurrentMetrics(data);
    } catch (error) {
      logger.error('Error fetching current metrics', { error });
      await calculateManualMetrics();
    }
  };

  const calculateManualMetrics = async () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Calculer les métriques manuellement
      const [
        usersResult,
        propertiesResult,
        applicationsResult
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_type, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('properties')
          .select('id, monthly_rent, city, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('rental_applications')
          .select('id, status, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      const totalUsers = (await supabase.from('profiles').select('id', { count: 'exact', head: true })).count || 0;
      const totalProperties = (await supabase.from('properties').select('id', { count: 'exact', head: true })).count || 0;

      const newUsers = usersResult.data?.length || 0;
      const newProperties = propertiesResult.data?.length || 0;
      const totalApplications = applicationsResult.data?.length || 0;
      const successfulApplications = applicationsResult.data?.filter(app => app.status === 'approved').length || 0;

      // Calculer le loyer moyen et la valeur totale
      const allProperties = propertiesResult.data || [];
      const avgRent = allProperties.length > 0
        ? allProperties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) / allProperties.length
        : 0;

      const totalRentValue = allProperties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);

      // Répartition par région
      const regionBreakdown: Record<string, number> = {};
      allProperties.forEach(p => {
        if (p.city) {
          regionBreakdown[p.city] = (regionBreakdown[p.city] || 0) + 1;
        }
      });

      // Répartition par type d'utilisateur
      const userTypeBreakdown: Record<string, number> = {};
      usersResult.data?.forEach(user => {
        if (user.user_type) {
          userTypeBreakdown[user.user_type] = (userTypeBreakdown[user.user_type] || 0) + 1;
        }
      });

      setCurrentMetrics({
        users: {
          total: totalUsers,
          active: totalUsers, // Simplification
          new: newUsers,
          growth_rate: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0
        },
        properties: {
          total: totalProperties,
          new: newProperties,
          avg_rent: avgRent,
          total_value: totalRentValue,
          growth_rate: totalProperties > 0 ? (newProperties / totalProperties) * 100 : 0
        },
        applications: {
          total: totalApplications,
          successful: successfulApplications,
          conversion_rate: totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0
        },
        platform: {
          page_views: 0, // À implémenter avec Google Analytics
          unique_visitors: 0,
          avg_session_duration: 0,
          bounce_rate: 0
        }
      });
    } catch (error) {
      logger.error('Error calculating manual metrics', { error });
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr });

      // Générer le rapport via fonction RPC
      const { data, error } = await supabase.rpc('generate_monthly_report', {
        p_month: month,
        p_year: year,
        p_title: `Rapport Mensuel - ${monthName}`
      });

      if (error) throw error;

      toast({
        title: "Rapport généré",
        description: `Le rapport pour ${monthName} a été généré avec succès`,
      });

      await fetchReports();
    } catch (error) {
      logger.error('Error generating monthly report', { error });
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport mensuel",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const sendReport = async (reportId: string) => {
    setSending(true);
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // Envoyer le rapport via fonction RPC
      const { error } = await supabase.rpc('send_monthly_report', {
        p_report_id: reportId,
        p_recipients: emailRecipients.length > 0 ? emailRecipients : report.recipients
      });

      if (error) throw error;

      toast({
        title: "Rapport envoyé",
        description: "Le rapport a été envoyé aux destinataires avec succès",
      });

      await fetchReports();
    } catch (error) {
      logger.error('Error sending monthly report', { error });
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rapport mensuel",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const downloadReport = async (reportId: string, format: 'pdf' | 'csv') => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const url = format === 'pdf' ? report.pdf_url : report.csv_url;
      if (!url) {
        toast({
          title: "Fichier non disponible",
          description: `Le rapport ${format.toUpperCase()} n'est pas encore disponible`,
          variant: "destructive",
        });
        return;
      }

      // Télécharger le fichier
      window.open(url, '_blank');
    } catch (error) {
      logger.error('Error downloading report', { error });
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le rapport",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'text-green-600 bg-green-50';
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'failed': return <TrendingDown className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPreviousMonth = () => {
    const date = new Date(selectedMonth);
    return format(subMonths(date, 1), 'yyyy-MM');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Rapports Mensuels & Analytics
          </h2>
          <p className="text-muted-foreground">
            Génération et envoi automatique des rapports de performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i);
                return (
                  <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                    {format(date, 'MMMM yyyy', { locale: fr })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={generating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Génération...' : 'Générer le rapport'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Current Month Metrics Preview */}
          {currentMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.users.total}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{currentMetrics.users.new} ce mois
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.properties.total}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{currentMetrics.properties.new} ce mois
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentMetrics.applications.conversion_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentMetrics.applications.successful}/{currentMetrics.applications.total}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loyer moyen</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(currentMetrics.properties.avg_rent).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">FCFA par mois</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des rapports</CardTitle>
              <CardDescription>
                Rapports mensuels générés et leur statut d'envoi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Généré le</TableHead>
                    <TableHead>Envoyé le</TableHead>
                    <TableHead>Destinataires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucun rapport généré pour ce mois
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(report.year, report.month - 1), 'MMMM yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-2">
                              {report.status === 'draft' && 'Brouillon'}
                              {report.status === 'generated' && 'Généré'}
                              {report.status === 'sent' && 'Envoyé'}
                              {report.status === 'failed' && 'Échec'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.generated_at ? format(new Date(report.generated_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {report.sent_at ? format(new Date(report.sent_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.recipients.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {report.pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReport(report.id, 'pdf')}
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                            )}
                            {report.csv_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReport(report.id, 'csv')}
                              >
                                <Download className="h-4 w-4" />
                                CSV
                              </Button>
                            )}
                            {report.status === 'generated' && (
                              <Button
                                size="sm"
                                onClick={() => sendReport(report.id)}
                                disabled={sending}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Envoyer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {currentMetrics && (
            <>
              {/* User Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Métriques Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{currentMetrics.users.total}</div>
                      <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                      <p className={`text-sm ${getGrowthColor(currentMetrics.users.growth_rate)}`}>
                        {formatGrowthRate(currentMetrics.users.growth_rate)} vs mois précédent
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{currentMetrics.users.new}</div>
                      <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{currentMetrics.users.active}</div>
                      <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Métriques Propriétés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{currentMetrics.properties.total}</div>
                      <p className="text-sm text-muted-foreground">Total propriétés</p>
                      <p className={`text-sm ${getGrowthColor(currentMetrics.properties.growth_rate)}`}>
                        {formatGrowthRate(currentMetrics.properties.growth_rate)} vs mois précédent
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{currentMetrics.properties.new}</div>
                      <p className="text-sm text-muted-foreground">Nouvelles ce mois</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(currentMetrics.properties.avg_rent).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Loyer moyen (FCFA)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Métriques Candidatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total des candidatures</span>
                      <span className="font-medium">{currentMetrics.applications.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Candidatures réussies</span>
                      <span className="font-medium text-green-600">{currentMetrics.applications.successful}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taux de conversion</span>
                      <span className="font-medium">
                        {currentMetrics.applications.conversion_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Taux de conversion</p>
                      <Progress value={currentMetrics.applications.conversion_rate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration des Rapports
              </CardTitle>
              <CardDescription>
                Paramètres pour la génération et l'envoi automatique des rapports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Destinataires par défaut</h4>
                <div className="space-y-2">
                  {['admin@mon-toit.ci', 'management@mon-toit.ci'].map((email, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{email}</span>
                      <Badge variant="outline">Admin</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Inclusions dans les rapports</h4>
                <div className="space-y-3">
                  {[
                    'Statistiques utilisateurs (total, actifs, nouveaux)',
                    'Métriques propriétés (total, nouvelles, loyer moyen)',
                    'Taux de conversion des candidatures',
                    'Répartition géographique (Abidjan, Bouaké, etc.)',
                    'Analyse comparative vs mois précédent',
                    'Analyse comparative vs année précédente',
                    'Export CSV pour analyse externe'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Planification</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Génération automatique:</span>
                    <Badge className="bg-green-100 text-green-800">Chaque 1er du mois</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Envoi automatique:</span>
                    <Badge className="bg-blue-100 text-blue-800">Chaque 5 du mois</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Format par défaut:</span>
                    <Badge variant="outline">PDF + CSV</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};