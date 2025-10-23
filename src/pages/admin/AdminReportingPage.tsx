import { FileBarChart, Download, Calendar, TrendingUp, Users, Home, DollarSign, Activity, Filter, RefreshCw, Clock, Eye, FileText, BarChart3, PieChart } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminReportingPage = () => {
  // Statistiques des rapports
  const reportingStats = {
    totalReports: 234,
    reportsThisMonth: 45,
    generatedToday: 12,
    scheduledReports: 8,
    avgGenerationTime: 2.3,
    popularReports: ['rapport_mensuel', 'rapport_activite', 'rapport_securite']
  };

  // Types de rapports disponibles
  const reportTypes = [
    {
      id: 1,
      name: 'Rapport Mensuel',
      description: 'Synthèse complète des activités mensuelles',
      category: 'business',
      frequency: 'monthly',
      lastGenerated: '2025-10-01',
      nextScheduled: '2025-11-01',
      format: ['pdf', 'excel'],
      popularity: 89
    },
    {
      id: 2,
      name: 'Rapport d\'Activité',
      description: 'Analyse détaillée des activités plateforme',
      category: 'analytics',
      frequency: 'weekly',
      lastGenerated: '2025-10-22',
      nextScheduled: '2025-10-29',
      format: ['pdf', 'csv'],
      popularity: 76
    },
    {
      id: 3,
      name: 'Rapport de Sécurité',
      description: 'État de sécurité et menaces détectées',
      category: 'security',
      frequency: 'daily',
      lastGenerated: '2025-10-23',
      nextScheduled: '2025-10-24',
      format: ['pdf'],
      popularity: 92
    },
    {
      id: 4,
      name: 'Rapport Financier',
      description: 'Analyse des revenus et transactions',
      category: 'financial',
      frequency: 'monthly',
      lastGenerated: '2025-10-01',
      nextScheduled: '2025-11-01',
      format: ['excel', 'pdf'],
      popularity: 67
    },
    {
      id: 5,
      name: 'Rapport Conformité',
      description: 'Vérification conformité réglementaire',
      category: 'compliance',
      frequency: 'quarterly',
      lastGenerated: '2025-09-30',
      nextScheduled: '2025-12-31',
      format: ['pdf'],
      popularity: 45
    }
  ];

  // Rapports récemment générés
  const recentReports = [
    {
      id: 1,
      name: 'Rapport Mensuel Octobre 2025',
      type: 'Rapport Mensuel',
      generatedBy: 'admin@ansut.ci',
      generatedAt: '2025-10-23 10:30:00',
      format: 'pdf',
      size: '2.4 MB',
      status: 'completed',
      downloads: 23
    },
    {
      id: 2,
      name: 'Rapport Sécurité Quotidien',
      type: 'Rapport de Sécurité',
      generatedBy: 'system',
      generatedAt: '2025-10-23 08:00:00',
      format: 'pdf',
      size: '1.2 MB',
      status: 'completed',
      downloads: 45
    },
    {
      id: 3,
      name: 'Analyse Performance Semaine 42',
      type: 'Rapport d\'Activité',
      generatedBy: 'analytics@mon-toit.ci',
      generatedAt: '2025-10-22 16:45:00',
      format: 'excel',
      size: '3.7 MB',
      status: 'completed',
      downloads: 12
    }
  ];

  // Rapports planifiés
  const scheduledReports = [
    {
      id: 1,
      name: 'Rapport Mensuel Novembre',
      type: 'Rapport Mensuel',
      nextRun: '2025-11-01 08:00:00',
      frequency: 'monthly',
      recipients: ['admin@ansut.ci', 'direction@mon-toit.ci'],
      enabled: true
    },
    {
      id: 2,
      name: 'Rapport Sécurité Quotidien',
      type: 'Rapport de Sécurité',
      nextRun: '2025-10-24 08:00:00',
      frequency: 'daily',
      recipients: ['security@mon-toit.ci', 'admin@ansut.ci'],
      enabled: true
    },
    {
      id: 3,
      name: 'Rapport Hebdomadaire Activité',
      type: 'Rapport d\'Activité',
      nextRun: '2025-10-28 17:00:00',
      frequency: 'weekly',
      recipients: ['analytics@mon-toit.ci'],
      enabled: true
    }
  ];

  const getCategoryBadge = (category: string) => {
    const variants = {
      business: 'default',
      analytics: 'secondary',
      security: 'destructive',
      financial: 'default',
      compliance: 'outline'
    } as const;

    const labels = {
      business: 'Business',
      analytics: 'Analytics',
      security: 'Sécurité',
      financial: 'Financier',
      compliance: 'Conformité'
    };

    return (
      <Badge variant={variants[category as keyof typeof variants]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      generating: 'secondary',
      failed: 'destructive',
      scheduled: 'outline'
    } as const;

    const labels = {
      completed: 'Terminé',
      generating: 'En cours',
      failed: 'Échoué',
      scheduled: 'Planifié'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    const variants = {
      daily: 'destructive',
      weekly: 'default',
      monthly: 'secondary',
      quarterly: 'outline'
    } as const;

    const labels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel'
    };

    return (
      <Badge variant={variants[frequency as keyof typeof variants]}>
        {labels[frequency as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-blue-700" />
            <div>
              <h1 className="text-3xl font-bold">Centre de Rapports</h1>
              <p className="text-muted-foreground">Génération et gestion des rapports administratifs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Planifier
            </Button>
            <Button>
              <FileBarChart className="h-4 w-4 mr-2" />
              Nouveau rapport
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rapports générés</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{reportingStats.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                Total des rapports
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{reportingStats.reportsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                +15% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{reportingStats.generatedToday}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {reportingStats.avgGenerationTime}min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{reportingStats.scheduledReports}</div>
              <p className="text-xs text-muted-foreground">
                Rapports automatisés
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Rapports disponibles</TabsTrigger>
            <TabsTrigger value="recent">Récemment générés</TabsTrigger>
            <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Types de rapports disponibles</CardTitle>
                    <CardDescription>
                      Modèles de rapports prédéfinis
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                        <SelectItem value="financial">Financier</SelectItem>
                        <SelectItem value="compliance">Conformité</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportTypes.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{report.name}</h4>
                            {getCategoryBadge(report.category)}
                            {getFrequencyBadge(report.frequency)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Formats:</p>
                              <p className="font-medium">{report.format.join(', ').toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Popularité:</p>
                              <div className="flex items-center gap-2">
                                <Progress value={report.popularity} className="w-12" />
                                <span className="font-medium">{report.popularity}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dernière génération:</p>
                              <p className="font-medium">{report.lastGenerated}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Prochaine planification:</p>
                              <p className="font-medium">{report.nextScheduled}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm">
                            <FileBarChart className="h-4 w-4 mr-1" />
                            Générer
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            Planifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rapports récemment générés</CardTitle>
                <CardDescription>
                  Historique des rapports générés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-muted-foreground">{report.type}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{report.format.toUpperCase()}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{report.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Par {report.generatedBy}</p>
                          <p className="text-xs text-muted-foreground">{report.generatedAt}</p>
                          <p className="text-xs text-muted-foreground">{report.downloads} téléchargements</p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(report.status)}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rapports planifiés</CardTitle>
                <CardDescription>
                  Rapports générés automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{report.name}</h4>
                            <Badge variant={report.enabled ? 'default' : 'secondary'}>
                              {report.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {report.frequency}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Prochaine exécution:</p>
                              <p className="font-medium">{report.nextRun}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Destinataires:</p>
                              <p className="font-medium">{report.recipients.length} personnes</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Utilisation des rapports</CardTitle>
                  <CardDescription>
                    Métriques d'utilisation du centre de rapports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Temps moyen de génération</span>
                    <span className="font-medium">{reportingStats.avgGenerationTime} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rapports les plus populaires</span>
                    <span className="font-medium">Rapport Sécurité</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de réussite</span>
                    <div className="flex items-center gap-2">
                      <Progress value={95} className="w-20" />
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Format préféré</span>
                    <span className="font-medium">PDF</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution par catégorie</CardTitle>
                  <CardDescription>
                    Répartition des rapports par type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Business</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <Progress value={35} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Sécurité</span>
                      <span className="font-medium">28%</span>
                    </div>
                    <Progress value={28} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Analytics</span>
                      <span className="font-medium">22%</span>
                    </div>
                    <Progress value={22} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Financier</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <Progress value={10} />
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

export default AdminReportingPage;