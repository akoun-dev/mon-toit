import { FileText, Search, Filter, Download, Eye, User, Settings, Database, Shield, AlertTriangle, Calendar, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminAuditPage = () => {
  // Statistiques d'audit
  const auditStats = {
    totalLogs: 152847,
    todayLogs: 1247,
    criticalEvents: 23,
    failedLogins: 45,
    dataAccess: 892,
    systemChanges: 67
  };

  // Logs d'audit récents
  const auditLogs = [
    {
      id: 1,
      timestamp: '2025-10-23 12:45:23',
      user: 'admin@ansut.ci',
      action: 'MODIFICATION UTILISATEUR',
      resource: 'user:12345',
      details: 'Changement de rôle pour user@example.com',
      severity: 'medium',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2025-10-23 12:42:15',
      user: 'system@mon-toit.ci',
      action: 'CONNEXION ADMIN',
      resource: 'admin_panel',
      details: 'Connexion au panneau d\'administration',
      severity: 'low',
      ip: '10.0.0.1',
      status: 'success'
    },
    {
      id: 3,
      timestamp: '2025-10-23 12:38:47',
      user: 'unknown@malicious.com',
      action: 'TENTATIVE INTRUSION',
      resource: '/api/admin/users',
      details: 'Tentative d\'accès non autorisée à l\'API admin',
      severity: 'critical',
      ip: '185.220.101.182',
      status: 'failed'
    },
    {
      id: 4,
      timestamp: '2025-10-23 12:35:12',
      user: 'agence@mon-toit.ci',
      action: 'EXPORT DONNEES',
      resource: 'properties_export',
      details: 'Export de 245 propriétés au format CSV',
      severity: 'medium',
      ip: '41.207.0.234',
      status: 'success'
    },
    {
      id: 5,
      timestamp: '2025-10-23 12:30:05',
      user: 'system@mon-toit.ci',
      action: 'SAUVEGARDE AUTO',
      resource: 'database_backup',
      details: 'Sauvegarde automatique quotidienne complétée',
      severity: 'low',
      ip: 'localhost',
      status: 'success'
    }
  ];

  // Catégories d'audit
  const auditCategories = [
    { name: 'Connexions', count: 3421, trend: 'up', icon: User },
    { name: 'Modifications', count: 1256, trend: 'stable', icon: Settings },
    { name: 'Accès données', count: 892, trend: 'up', icon: Database },
    { name: 'Sécurité', count: 423, trend: 'down', icon: Shield },
    { name: 'Système', count: 2155, trend: 'stable', icon: AlertTriangle },
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

  const getStatusIcon = (status: string) => {
    return status === 'success' ?
      <Eye className="h-4 w-4 text-green-500" /> :
      <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold">Journal d'Audit</h1>
              <p className="text-muted-foreground">Consultation des logs et activités système</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs aujourd'hui</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats.todayLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% par rapport à hier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{auditStats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Requiert une investigation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connexions échouées</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{auditStats.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                Dernières 24 heures
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Journaux récents</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="search">Recherche avancée</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Journaux d'audit récents</CardTitle>
                    <CardDescription>
                      Dernières activités enregistrées par le système
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par sévérité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher dans les logs..."
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>

                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                          <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                          <TableHead className="whitespace-nowrap">Action</TableHead>
                          <TableHead className="whitespace-nowrap">Détails</TableHead>
                          <TableHead className="whitespace-nowrap">IP Source</TableHead>
                          <TableHead className="whitespace-nowrap">Sévérité</TableHead>
                          <TableHead className="whitespace-nowrap">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {log.timestamp}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div>
                                <p className="font-medium text-sm md:text-base">{log.user}</p>
                                <p className="text-xs text-muted-foreground">{log.resource}</p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="font-medium text-sm">{log.action}</span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <span className="text-sm">{log.details}</span>
                            </TableCell>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {log.ip}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getSeverityBadge(log.severity)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(log.status)}
                                <span className="text-sm capitalize">{log.status}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Affichage de 1 à {auditLogs.length} sur {auditStats.totalLogs.toLocaleString()} entrées
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Précédent</Button>
                      <Button variant="outline" size="sm">Suivant</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catégories d'audit</CardTitle>
                <CardDescription>
                  Répartition des logs par type d'action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auditCategories.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.count.toLocaleString()} entrées
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={
                            category.trend === 'up' ? 'default' :
                            category.trend === 'down' ? 'secondary' : 'outline'
                          }>
                            {category.trend === 'up' ? '↗' :
                             category.trend === 'down' ? '↘' : '→'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recherche avancée</CardTitle>
                <CardDescription>
                  Recherche détaillée dans les journaux d'audit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Période</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Dernière semaine</SelectItem>
                        <SelectItem value="month">Dernier mois</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Utilisateur</label>
                    <Input placeholder="Email ou ID utilisateur" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Action</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="login">Connexions</SelectItem>
                        <SelectItem value="modify">Modifications</SelectItem>
                        <SelectItem value="access">Accès données</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sévérité</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les niveaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Réinitialiser</Button>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rapports prédéfinis</CardTitle>
                  <CardDescription>
                    Rapports d'audit générés automatiquement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport journalier
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport hebdomadaire
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport mensuel
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Rapport de sécurité
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export de données</CardTitle>
                  <CardDescription>
                    Exporter les logs d'audit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter en CSV
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter en JSON
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter en PDF
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter en Excel
                    </Button>
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

export default AdminAuditPage;