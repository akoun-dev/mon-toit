import { Shield, Eye, Database, Lock, User, AlertTriangle, Key, FileText, Clock, Activity, Ban, Download, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminSecurityPage = () => {
  // Statistiques des accès sensibles
  const accessStats = {
    totalSensitiveAccess: 892,
    todayAccess: 127,
    highRiskAccess: 23,
    blockedAccess: 8,
    unusualPatterns: 5,
    criticalResources: 12
  };

  // Accès récents aux données sensibles
  const recentAccess = [
    {
      id: 1,
      timestamp: '2025-10-23 12:45:23',
      user: 'admin@ansut.ci',
      resource: 'Base utilisateurs',
      action: 'LECTURE COMPLÈTE',
      ip: '192.168.1.100',
      risk: 'low',
      status: 'authorized',
      duration: '2m 34s'
    },
    {
      id: 2,
      timestamp: '2025-10-23 12:42:15',
      user: 'manager@agence.ci',
      resource: 'Données financières',
      action: 'EXPORT CSV',
      ip: '41.207.0.234',
      risk: 'high',
      status: 'authorized',
      duration: '5m 12s'
    },
    {
      id: 3,
      timestamp: '2025-10-23 12:38:47',
      user: 'unknown@suspicious.com',
      resource: 'Logs système',
      action: 'TENTATIVE ACCÈS',
      ip: '185.220.101.182',
      risk: 'critical',
      status: 'blocked',
      duration: '0s'
    },
    {
      id: 4,
      timestamp: '2025-10-23 12:35:12',
      user: 'developer@mon-toit.ci',
      resource: 'Configuration API',
      action: 'MODIFICATION',
      ip: '10.0.0.45',
      risk: 'medium',
      status: 'authorized',
      duration: '1m 45s'
    },
    {
      id: 5,
      timestamp: '2025-10-23 12:30:05',
      user: 'system@mon-toit.ci',
      resource: 'Clés de chiffrement',
      action: 'ROTATION AUTO',
      ip: 'localhost',
      risk: 'low',
      status: 'authorized',
      duration: '3m 20s'
    }
  ];

  // Ressources critiques
  const criticalResources = [
    {
      name: 'Base utilisateurs complète',
      type: 'Database',
      accessCount: 45,
      lastAccess: 'Il y a 2 min',
      riskLevel: 'high',
      status: 'active'
    },
    {
      name: 'Données financières',
      type: 'Financial Data',
      accessCount: 23,
      lastAccess: 'Il y a 15 min',
      riskLevel: 'critical',
      status: 'active'
    },
    {
      name: 'Clés de chiffrement',
      type: 'Encryption Keys',
      accessCount: 8,
      lastAccess: 'Il y a 1h',
      riskLevel: 'critical',
      status: 'restricted'
    },
    {
      name: 'Logs système complets',
      type: 'System Logs',
      accessCount: 67,
      lastAccess: 'Il y a 30 min',
      riskLevel: 'medium',
      status: 'active'
    }
  ];

  // Utilisateurs avec accès privilégiés
  const privilegedUsers = [
    {
      email: 'admin@ansut.ci',
      role: 'Super Admin',
      accessLevel: 'full',
      lastAccess: 'Il y a 2 min',
      resourcesAccessed: 12,
      riskScore: 85
    },
    {
      email: 'security@mon-toit.ci',
      role: 'Security Officer',
      accessLevel: 'high',
      lastAccess: 'Il y a 15 min',
      resourcesAccessed: 8,
      riskScore: 65
    },
    {
      email: 'dba@mon-toit.ci',
      role: 'Database Admin',
      accessLevel: 'high',
      lastAccess: 'Il y a 1h',
      resourcesAccessed: 5,
      riskScore: 70
    }
  ];

  const getRiskBadge = (risk: string) => {
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
      <Badge variant={variants[risk as keyof typeof variants]}>
        {labels[risk as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      authorized: 'default',
      blocked: 'destructive',
      pending: 'secondary'
    } as const;

    const labels = {
      authorized: 'Autorisé',
      blocked: 'Bloqué',
      pending: 'En attente'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    return status === 'authorized' ?
      <Eye className="h-4 w-4 text-green-500" /> :
      <Ban className="h-4 w-4 text-red-500" />;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold">Accès Sensibles</h1>
              <p className="text-muted-foreground">Surveillance des accès aux données critiques</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Scanner
            </Button>
          </div>
        </div>

        {/* Alerte d'accès critique */}
        {accessStats.highRiskAccess > 20 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              Activité suspecte détectée
            </AlertTitle>
            <AlertDescription className="text-red-700">
              {accessStats.highRiskAccess} accès à haut risque ont été détectés aujourd'hui. Une investigation est recommandée.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accès aujourd'hui</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessStats.todayAccess}</div>
              <p className="text-xs text-muted-foreground">
                +8% par rapport à hier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accès à haut risque</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{accessStats.highRiskAccess}</div>
              <p className="text-xs text-muted-foreground">
                Nécessite attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accès bloqués</CardTitle>
              <Ban className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{accessStats.blockedAccess}</div>
              <p className="text-xs text-muted-foreground">
                Tentatives bloquées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ressources critiques</CardTitle>
              <Database className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessStats.criticalResources}</div>
              <p className="text-xs text-muted-foreground">
                Sous surveillance
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="access" className="space-y-4">
          <TabsList>
            <TabsTrigger value="access">Accès récents</TabsTrigger>
            <TabsTrigger value="resources">Ressources critiques</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs privilégiés</TabsTrigger>
            <TabsTrigger value="policies">Politiques</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Journal des accès sensibles</CardTitle>
                <CardDescription>
                  Derniers accès aux données sensibles du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                        <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                        <TableHead className="whitespace-nowrap">Ressource</TableHead>
                        <TableHead className="whitespace-nowrap">Action</TableHead>
                        <TableHead className="whitespace-nowrap">IP Source</TableHead>
                        <TableHead className="whitespace-nowrap">Risque</TableHead>
                        <TableHead className="whitespace-nowrap">Statut</TableHead>
                        <TableHead className="whitespace-nowrap">Durée</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAccess.map((access) => (
                        <TableRow key={access.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {access.timestamp}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm">{access.user}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm">{access.resource}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="font-medium text-sm">{access.action}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {access.ip}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getRiskBadge(access.risk)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(access.status)}
                              <span className="text-sm">{getStatusBadge(access.status).props.children}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {access.duration}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ressources critiques</CardTitle>
                <CardDescription>
                  Données et systèmes sensibles sous surveillance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {criticalResources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          resource.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {resource.type} • {resource.accessCount} accès aujourd'hui
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getRiskBadge(resource.riskLevel)}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Dernier accès</p>
                          <p className="font-medium">{resource.lastAccess}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs à accès privilégiés</CardTitle>
                <CardDescription>
                  Utilisateurs avec permissions d'accès aux données sensibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {privilegedUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role} • Niveau: {user.accessLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score de risque</p>
                          <div className="flex items-center gap-2">
                            <Progress value={user.riskScore} className="w-20" />
                            <span className="text-sm font-medium">{user.riskScore}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Ressources</p>
                          <p className="font-medium">{user.resourcesAccessed}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Dernier accès</p>
                          <p className="font-medium">{user.lastAccess}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Politiques d'accès</CardTitle>
                  <CardDescription>
                    Règles de contrôle d'accès aux données sensibles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Authentification multi-facteurs</p>
                      <p className="text-sm text-muted-foreground">
                        Obligatoire pour l'accès aux données critiques
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Journalisation complète</p>
                      <p className="text-sm text-muted-foreground">
                        Tous les accès sont enregistrés et surveillés
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Validation manuelle</p>
                      <p className="text-sm text-muted-foreground">
                        Approbation requise pour les accès à haut risque
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Limitation temporelle</p>
                      <p className="text-sm text-muted-foreground">
                        Accès limité aux heures de travail
                      </p>
                    </div>
                    <Badge variant="secondary">Désactivé</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contrôles de sécurité</CardTitle>
                  <CardDescription>
                    Mécanismes de protection des accès sensibles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-500" />
                      <span>Chiffrement bout-en-bout</span>
                    </div>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span>Contrôle d'intégrité</span>
                    </div>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>Surveillance en temps réel</span>
                    </div>
                    <Badge variant="default">Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>Expiration automatique</span>
                    </div>
                    <Badge variant="default">Activé</Badge>
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

export default AdminSecurityPage;