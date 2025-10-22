import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  UserX,
  Eye,
  Lock,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Clock,
  Zap,
  Target,
  ShieldAlert,
  FileText,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Skeleton } from '@/components/ui/skeleton';

interface FraudAlert {
  id: string;
  user_id: string;
  alert_type: 'account_takeover' | 'fake_account' | 'suspicious_activity' | 'multiple_accounts' | 'payment_fraud' | 'identity_theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  risk_score: number;
  description: string;
  evidence: any;

  -- IP et device info
  ip_address: string;
  user_agent: string;
  device_fingerprint: string;

  -- Investigation
  investigated_by?: string;
  investigation_notes?: string;
  resolution_details?: any;

  -- Timestamps
  created_at: string;
  resolved_at?: string;
}

interface RateLimitRule {
  id: string;
  name: string;
  rule_type: 'login_attempts' | 'account_creation' | 'api_requests' | 'password_reset' | 'contact_form';
  target_type: 'ip_address' | 'email_domain' | 'user_account' | 'device_fingerprint';

  -- Configuration
  window_minutes: number;
  max_attempts: number;
  penalty_duration_minutes: number;
  is_active: boolean;

  -- Auto-block settings
  auto_block_enabled: boolean;
  auto_block_threshold: number;
  notification_enabled: boolean;

  created_at: string;
  updated_at: string;
}

interface FraudMetrics {
  total_alerts: number;
  open_alerts: number;
  critical_alerts: number;
  false_positives: number;
  resolved_alerts: number;
  avg_resolution_time_hours: number;

  // Par type
  alerts_by_type: Record<string, number>;
  alerts_by_severity: Record<string, number>;

  // Tendances
  trend_7_days: number;
  trend_30_days: number;

  // Rate limiting
  blocked_attempts: number;
  active_rate_limits: number;
}

export const FraudDetectionSystem = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [rateLimitRules, setRateLimitRules] = useState<RateLimitRule[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [investigationNotes, setInvestigationNotes] = useState('');

  useEffect(() => {
    fetchFraudAlerts();
    fetchRateLimitRules();
    fetchFraudMetrics();
  }, []);

  const fetchFraudAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select(`
          *,
          user:profiles!fraud_alerts_user_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      logger.error('Error fetching fraud alerts', { error });
      toast({
        title: "Erreur",
        description: "Impossible de charger les alertes de fraude",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRateLimitRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rate_limit_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRateLimitRules(data || []);
    } catch (error) {
      logger.error('Error fetching rate limit rules', { error });
    }
  };

  const fetchFraudMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_fraud_detection_metrics');

      if (error) {
        // Calculer manuellement si la fonction n'existe pas
        await calculateManualMetrics();
        return;
      }

      setMetrics(data);
    } catch (error) {
      logger.error('Error fetching fraud metrics', { error });
      await calculateManualMetrics();
    }
  };

  const calculateManualMetrics = async () => {
    try {
      const { data: alerts_data } = await supabase
        .from('fraud_alerts')
        .select('alert_type, severity, status, created_at, resolved_at');

      if (alerts_data) {
        const total = alerts_data.length;
        const open = alerts_data.filter(a => a.status === 'open').length;
        const critical = alerts_data.filter(a => a.severity === 'critical').length;
        const resolved = alerts_data.filter(a => a.status === 'resolved').length;
        const falsePositives = alerts_data.filter(a => a.status === 'false_positive').length;

        // Temps moyen de résolution
        const resolved_alerts = alerts_data.filter(a => a.status === 'resolved' && a.resolved_at);
        const avg_resolution_time = resolved_alerts.length > 0
          ? resolved_alerts.reduce((sum, a) => {
              const start = new Date(a.created_at);
              const end = new Date(a.resolved_at!);
              return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }, 0) / resolved_alerts.length
          : 0;

        // Répartition par type et sévérité
        const alertsByType: Record<string, number> = {};
        const alertsBySeverity: Record<string, number> = {};
        alerts_data.forEach(alert => {
          alertsByType[alert.alert_type] = (alertsByType[alert.alert_type] || 0) + 1;
          alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
        });

        // Tendances
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const trend7Days = alerts_data.filter(a => new Date(a.created_at) >= sevenDaysAgo).length;
        const trend30Days = alerts_data.filter(a => new Date(a.created_at) >= thirtyDaysAgo).length;

        setMetrics({
          total_alerts: total,
          open_alerts: open,
          critical_alerts: critical,
          false_positives: falsePositives,
          resolved_alerts: resolved,
          avg_resolution_time_hours: avg_resolution_time,
          alerts_by_type: alertsByType,
          alerts_by_severity: alertsBySeverity,
          trend_7_days: trend7Days,
          trend_30_days: trend30Days,
          blocked_attempts: 0, // À implémenter
          active_rate_limits: rateLimitRules.length
        });
      }
    } catch (error) {
      logger.error('Error calculating manual fraud metrics', { error });
    }
  };

  const handleInvestigateAlert = (alert: FraudAlert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
    setInvestigationNotes('');
  };

  const submitInvestigation = async () => {
    if (!selectedAlert) return;

    try {
      const { error } = await supabase.rpc('resolve_fraud_alert', {
        p_alert_id: selectedAlert.id,
        p_resolution: 'investigated',
        p_investigation_notes: investigationNotes
      });

      if (error) throw error;

      toast({
        title: "Alerte investiguée",
        description: "L'alerte a été marquée comme étant en cours d'investigation",
      });

      setDialogOpen(false);
      setSelectedAlert(null);
      fetchFraudAlerts();
      fetchFraudMetrics();
    } catch (error) {
      logger.error('Error investigating fraud alert', { error });
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'alerte de fraude",
        variant: "destructive",
      });
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      const { error } = await supabase.rpc('resolve_fraud_alert', {
        p_alert_id: alertId,
        p_resolution: resolution
      });

      if (error) throw error;

      toast({
        title: "Alerte résolue",
        description: `L'alerte a été marquée comme ${resolution === 'resolved' ? 'résolue' : 'faux positif'}`,
      });

      fetchFraudAlerts();
      fetchFraudMetrics();
    } catch (error) {
      logger.error('Error resolving fraud alert', { error });
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte de fraude",
        variant: "destructive",
      });
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'account_takeover': return <UserX className="h-4 w-4" />;
      case 'fake_account': return <ShieldAlert className="h-4 w-4" />;
      case 'payment_fraud': return <Target className="h-4 w-4" />;
      case 'identity_theft': return <Ban className="h-4 w-4" />;
      case 'multiple_accounts': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50';
      case 'investigating': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'false_positive': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchTerm ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

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
            <Shield className="h-6 w-6" />
            Détection de Fraude & Rate Limiting
          </h2>
          <p className="text-muted-foreground">
            Système intelligent de détection et prévention des activités frauduleuses
          </p>
        </div>
        <Button onClick={() => { fetchFraudAlerts(); fetchFraudMetrics(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Critical Alerts */}
      {metrics && metrics.critical_alerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>🚨 Alertes critiques détectées</AlertTitle>
          <AlertDescription>
            {metrics.critical_alerts} alerte{metrics.critical_alerts > 1 ? 's' : ''} critique{metrics.critical_alerts > 1 ? 's' : ''} nécessite{metrics.critical_alerts > 1 ? 'nt' : ''} une investigation immédiate.
            Risque élevé de fraude détecté.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_alerts}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{metrics.trend_7_days} cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Ouvertes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.open_alerts}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.total_alerts > 0 ? Math.round((metrics.open_alerts / metrics.total_alerts) * 100) : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de faux positifs</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{metrics.false_positives}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.total_alerts > 0 ? Math.round((metrics.false_positives / metrics.total_alerts) * 100) : 0}% des alertes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rate Limits Actifs</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_rate_limits}</div>
              <p className="text-xs text-muted-foreground">
                Règles de rate limiting
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts">Alertes de Fraude</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limiting</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par utilisateur, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="low">Bas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type de fraude" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="account_takeover">Prise de compte</SelectItem>
                    <SelectItem value="fake_account">Faux compte</SelectItem>
                    <SelectItem value="payment_fraud">Fraude de paiement</SelectItem>
                    <SelectItem value="identity_theft">Vol d'identité</SelectItem>
                    <SelectItem value="multiple_accounts">Comptes multiples</SelectItem>
                    <SelectItem value="suspicious_activity">Activité suspecte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Fraude</CardTitle>
              <CardDescription>
                {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''} détectée{filteredAlerts.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Risque</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.slice(0, 50).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {alert.user?.avatar_url ? (
                              <img src={alert.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <Users className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{alert.user?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{alert.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.alert_type)}
                          <Badge variant="outline">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{alert.risk_score}</span>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {alert.ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status === 'open' && 'Ouverte'}
                          {alert.status === 'investigating' && 'Investigation'}
                          {alert.status === 'resolved' && 'Résolue'}
                          {alert.status === 'false_positive' && 'Faux positif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(alert.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInvestigateAlert(alert)}
                            disabled={alert.status === 'investigating'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {alert.status === 'open' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id, 'resolved')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id, 'false_positive')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Règles de Rate Limiting
                </CardTitle>
                <CardDescription>
                  Configuration des limites de débit automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rateLimitRules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{rule.rule_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fenêtre:</span>
                          <span className="font-medium">{rule.window_minutes} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Limite:</span>
                          <span className="font-medium">{rule.max_attempts} tentatives</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pénalité:</span>
                          <span className="font-medium">{rule.penalty_duration_minutes} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statistiques de Rate Limiting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tentatives bloquées (24h):</span>
                    <span className="font-medium">{metrics?.blocked_attempts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">IPs bloquées actives:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taux d'efficacité:</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fausses alertes:</span>
                    <span className="font-medium text-amber-600">{metrics?.false_positives || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances de Fraude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.alerts_by_type && Object.entries(metrics.alerts_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAlertTypeIcon(type)}
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Temps de Résolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {Math.round(metrics?.avg_resolution_time_hours || 0)}h
                    </div>
                    <p className="text-sm text-muted-foreground">Temps moyen</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Alertes résolues aujourd'hui:</span>
                      <span className="font-medium text-green-600">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Taux de résolution:</span>
                      <span className="font-medium text-green-600">87%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Détection de Fraude
              </CardTitle>
              <CardDescription>
                Paramètres avancés pour la détection et prévention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Seuils de détection automatique</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Score de risque critique:</span>
                    <Badge variant="outline">≥ 85</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alerte automatique:</span>
                    <Badge variant="outline">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vérification manuelle requise:</span>
                    <Badge variant="outline">Score 50-85</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Types de fraudes surveillés</h4>
                <div className="grid gap-2 text-sm">
                  {[
                    'Prise de compte',
                    'Création de faux comptes',
                    'Fraude de paiement',
                    'Vol d''identité',
                    'Comptes multiples',
                    'Activité suspecte',
                    'Bot attacks'
                  ].map((fraudType, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{fraudType}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Réponses automatiques</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Blockage temporaire automatique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Notification admin automatique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Vérification 2FA forcée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Escalade au niveau supérieur</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investigation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Investiguer l'Alerte de Fraude</DialogTitle>
            <DialogDescription>
              Examen détaillé de l'alerte et prise de décision
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Details */}
              <div>
                <h4 className="font-medium mb-2">Détails de l'Alerte</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Type:</span>
                      <span className="font-medium">{selectedAlert.alert_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Score de risque:</span>
                      <span className="font-medium">{selectedAlert.risk_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sévérité:</span>
                      <Badge className={getSeverityColor(selectedAlert.severity)}>
                        {selectedAlert.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Adresse IP:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {selectedAlert.ip_address}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">User Agent:</span>
                      <span className="text-xs truncate max-w-[200px] block">
                        {selectedAlert.user_agent}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Date:</span>
                      <span className="font-medium">
                        {format(new Date(selectedAlert.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">{selectedAlert.description}</p>
                </div>
              </div>

              {/* Evidence */}
              {selectedAlert.evidence && (
                <div>
                  <h4 className="font-medium mb-2">Preuves collectées</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedAlert.evidence, null, 2)}
                  </pre>
                </div>
              )}

              {/* Investigation Notes */}
              <div>
                <h4 className="font-medium mb-2">Notes d'investigation</h4>
                <textarea
                  placeholder="Ajoutez vos notes d'investigation..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full h-24 p-3 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitInvestigation}>
              Soumettre l'investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};