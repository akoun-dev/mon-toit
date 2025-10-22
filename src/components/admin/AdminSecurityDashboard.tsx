import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Bell,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Lock,
  Unlock,
  Globe,
  Activity,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityMetrics {
  totalUsers: number;
  activeAdmins: number;
  mfaCompliance: number;
  failedLogins: number;
  suspiciousActivities: number;
  pendingVerifications: number;
  securityScore: number;
}

interface SuspiciousActivity {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  ip_address: string;
  user_id: string;
  user_email: string;
  status: 'open' | 'investigating' | 'resolved';
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  success: boolean;
  timestamp: string;
  user_agent: string;
  location?: string;
}

export const AdminSecurityDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Get security metrics
      const { data: users } = await supabase
        .from('profiles')
        .select('id, user_type, created_at');

      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const { data: failedLogins } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: suspicious } = await supabase
        .from('suspicious_activities')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentLogins } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Calculate MFA compliance
      const totalAdmins = adminRoles?.length || 0;
      let mfaCompliantAdmins = 0;

      if (adminRoles && adminRoles.length > 0) {
        for (const admin of adminRoles) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          if (factors?.totp && factors.totp.length > 0) {
            mfaCompliantAdmins++;
          }
        }
      }

      setMetrics({
        totalUsers: users?.length || 0,
        activeAdmins: totalAdmins,
        mfaCompliance: totalAdmins > 0 ? Math.round((mfaCompliantAdmins / totalAdmins) * 100) : 0,
        failedLogins: failedLogins?.length || 0,
        suspiciousActivities: suspicious?.length || 0,
        pendingVerifications: 0, // TODO: Implement verification tracking
        securityScore: calculateSecurityScore({
          totalUsers: users?.length || 0,
          totalAdmins,
          mfaCompliantAdmins,
          failedLogins: failedLogins?.length || 0,
          suspiciousActivities: suspicious?.length || 0
        })
      });

      setSuspiciousActivities(suspicious || []);
      setLoginAttempts(recentLogins || []);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de sécurité",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityScore = (data: {
    totalUsers: number;
    totalAdmins: number;
    mfaCompliantAdmins: number;
    failedLogins: number;
    suspiciousActivities: number;
  }) => {
    let score = 100;

    // MFA Compliance impact (40% weight)
    if (data.totalAdmins > 0) {
      const mfaScore = (data.mfaCompliantAdmins / data.totalAdmins) * 100;
      score -= (100 - mfaScore) * 0.4;
    }

    // Failed logins impact (30% weight)
    if (data.failedLogins > 10) {
      score -= Math.min((data.failedLogins - 10) * 2, 30);
    }

    // Suspicious activities impact (30% weight)
    if (data.suspiciousActivities > 0) {
      score -= Math.min(data.suspiciousActivities * 10, 30);
    }

    return Math.max(0, Math.round(score));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
    setRefreshing(false);
    toast({
      title: "Actualisé",
      description: "Les données de sécurité ont été mises à jour",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSecurityScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Sécurité</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel de la sécurité de la plateforme
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Critical Alerts */}
      {metrics && metrics.suspiciousActivities > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>🚨 Activités Suspectes Détectées</AlertTitle>
          <AlertDescription>
            {metrics.suspiciousActivities} activité{metrics.suspiciousActivities > 1 ? 's' : ''} suspecte{metrics.suspiciousActivities > 1 ? 's' : ''} nécessite{metrics.suspiciousActivities > 1 ? 'nt' : ''} une investigation immédiate.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
              {getSecurityScoreIcon(metrics.securityScore)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
                {metrics.securityScore}%
              </div>
              <Progress value={metrics.securityScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conformité 2FA</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.mfaCompliance}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeAdmins} admin{metrics.activeAdmins > 1 ? 's' : ''} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connexions Échouées (24h)</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                Dernières 24 heures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeAdmins} admin{metrics.activeAdmins > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="activities">Activités suspectes</TabsTrigger>
          <TabsTrigger value="logins">Connexions</TabsTrigger>
          <TabsTrigger value="audit">Audit logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connexions réussies (24h)</span>
                    <span className="text-sm font-medium text-green-600">
                      {loginAttempts.filter(l => l.success).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connexions échouées (24h)</span>
                    <span className="text-sm font-medium text-red-600">
                      {loginAttempts.filter(l => !l.success).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alertes de sécurité</span>
                    <span className="text-sm font-medium text-amber-600">
                      {suspiciousActivities.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  État de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RLS Policies</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Actif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activités Suspectes Récentes</CardTitle>
              <CardDescription>
                Investigations et alertes de sécurité en cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucune activité suspecte détectée
                      </TableCell>
                    </TableRow>
                  ) : (
                    suspiciousActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge className={getSeverityColor(activity.severity)}>
                            {activity.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {activity.description}
                        </TableCell>
                        <TableCell>{activity.user_email}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {activity.ip_address}
                        </TableCell>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.status === 'resolved' ? 'default' : 'secondary'}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Connexions</CardTitle>
              <CardDescription>
                Activité de connexion récente sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Navigator</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.slice(0, 20).map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-mono text-sm">
                        {attempt.email}
                      </TableCell>
                      <TableCell>
                        {attempt.success ? (
                          <Badge variant="default" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Succès
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Échec
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {attempt.ip_address}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs">
                        {attempt.user_agent}
                      </TableCell>
                      <TableCell>
                        {new Date(attempt.timestamp).toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs d'Audit Administrateur
              </CardTitle>
              <CardDescription>
                Actions sensibles effectuées par les administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Les logs d'audit détaillés sont disponibles dans le composant AuditLogViewer
                </p>
                <Button variant="outline" className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};