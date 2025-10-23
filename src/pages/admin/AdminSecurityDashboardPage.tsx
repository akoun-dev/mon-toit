import { Activity, Shield, AlertTriangle, Users, Eye, Lock, Globe, Wifi, Cpu, Database } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminSecurityDashboardPage = () => {
  // Statistiques de sécurité
  const securityStats = {
    totalThreats: 24,
    activeThreats: 3,
    blockedAttacks: 127,
    securityScore: 92,
    activeSessions: 342,
    suspiciousIPs: 8,
    dataBreaches: 0,
    vulnerabilities: 5
  };

  // Menaces actives
  const activeThreats = [
    {
      id: 1,
      type: 'Tentative de force brute',
      severity: 'high',
      source: '192.168.1.100',
      target: 'admin@mon-toit.ci',
      time: 'Il y a 2 min',
      status: 'active'
    },
    {
      id: 2,
      type: 'Connexion multiple suspecte',
      severity: 'medium',
      source: '10.0.0.45',
      target: 'Multiple comptes',
      time: 'Il y a 15 min',
      status: 'monitoring'
    },
    {
      id: 3,
      type: 'Accès non autorisé API',
      severity: 'high',
      source: 'Unknown',
      target: '/api/admin/users',
      time: 'Il y a 1h',
      status: 'blocked'
    }
  ];

  // Événements de sécurité récents
  const securityEvents = [
    { id: 1, event: 'Nouvelle politique 2FA appliquée', user: 'System', time: 'Il y a 5 min', level: 'info' },
    { id: 2, event: 'Mise à jour des certificats SSL', user: 'admin@ansut.ci', time: 'Il y a 30 min', level: 'success' },
    { id: 3, event: 'Détection d\'anomalie de trafic', user: 'AI Monitor', time: 'Il y a 1h', level: 'warning' },
    { id: 4, event: 'Sauvegarde de sécurité complète', user: 'System', time: 'Il y a 2h', level: 'success' },
    { id: 5, event: 'Blocage de IP suspecte', user: 'Firewall', time: 'Il y a 3h', level: 'error' },
  ];

  // État des systèmes
  const systemStatus = [
    { name: 'Firewall', status: 'healthy', uptime: '99.9%', lastCheck: 'Il y a 2 min' },
    { name: 'Antivirus', status: 'healthy', uptime: '100%', lastCheck: 'Il y a 1 min' },
    { name: 'IDS/IPS', status: 'warning', uptime: '98.5%', lastCheck: 'Il y a 5 min' },
    { name: 'Backup System', status: 'healthy', uptime: '100%', lastCheck: 'Il y a 10 min' },
    { name: 'SSL Certificates', status: 'healthy', uptime: '100%', lastCheck: 'Il y a 1h' },
  ];

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      critical: 'Critique',
      high: 'Élevé',
      medium: 'Moyen',
      low: 'Faible'
    };

    return (
      <Badge variant={variants[severity as keyof typeof variants]}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    const labels = {
      healthy: 'Sain',
      warning: 'Attention',
      error: 'Erreur'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getEventIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Lock className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-bold">Dashboard Sécurité</h1>
              <p className="text-muted-foreground">Monitoring de sécurité en temps réel</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Rapport complet</Button>
            <Button>Scanner sécurité</Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {securityStats.activeThreats > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              {securityStats.activeThreats} menace(s) active(s) détectée(s)
            </AlertTitle>
            <AlertDescription className="text-red-700">
              Des menaces de sécurité nécessitent une attention immédiate. Consultez la section "Menaces actives".
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de sécurité</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{securityStats.securityScore}%</div>
              <Progress value={securityStats.securityScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Excellent état de sécurité
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menaces actives</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{securityStats.activeThreats}</div>
              <p className="text-xs text-muted-foreground">
                Requiert une action immédiate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attaques bloquées</CardTitle>
              <Lock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{securityStats.blockedAttacks}</div>
              <p className="text-xs text-muted-foreground">
                Dernières 24 heures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions actives</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs connectés
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="threats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="threats">Menaces actives</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="systems">Systèmes</TabsTrigger>
            <TabsTrigger value="network">Réseau</TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Menaces de sécurité actives</CardTitle>
                <CardDescription>
                  Menaces détectées nécessitant une attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeThreats.map((threat) => (
                    <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          threat.status === 'active' ? 'bg-red-500' :
                          threat.status === 'monitoring' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium">{threat.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Source: {threat.source} → Cible: {threat.target}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getSeverityBadge(threat.severity)}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{threat.time}</p>
                          <Button size="sm" variant="outline" className="mt-1">Détails</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Événements de sécurité récents</CardTitle>
                <CardDescription>
                  Journal des activités de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getEventIcon(event.level)}
                      <div className="flex-1">
                        <p className="font-medium">{event.event}</p>
                        <p className="text-sm text-muted-foreground">
                          Par {event.user} • {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>État des systèmes de sécurité</CardTitle>
                <CardDescription>
                  État de santé des composants de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemStatus.map((system, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          system.status === 'healthy' ? 'bg-green-500' :
                          system.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{system.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uptime: {system.uptime} • {system.lastCheck}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(system.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques réseau</CardTitle>
                  <CardDescription>
                    Métriques de trafic et connexions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span>Trafic total</span>
                    </div>
                    <span className="font-medium">2.4 TB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span>Connexions actives</span>
                    </div>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>IPs uniques</span>
                    </div>
                    <span className="font-medium">892</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>IPs suspectes</span>
                    </div>
                    <span className="font-medium text-yellow-600">{securityStats.suspiciousIPs}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ressources système</CardTitle>
                  <CardDescription>
                    Utilisation des ressources critiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        <span>CPU</span>
                      </div>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-500" />
                        <span>Mémoire</span>
                      </div>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-500" />
                        <span>Bande passante</span>
                      </div>
                      <span className="font-medium">23%</span>
                    </div>
                    <Progress value={23} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminSecurityDashboardPage;