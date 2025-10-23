import { Flag, AlertTriangle, Eye, Clock, CheckCircle, XCircle, AlertCircle, Users, Image, MessageSquare, FileText, Search, Filter, RefreshCw, Ban, Shield, Trash2, Edit, Archive, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminModerationPage = () => {
  // Statistiques de modération
  const moderationStats = {
    totalReports: 234,
    pendingReview: 45,
    resolvedToday: 67,
    escalatedReports: 12,
    autoBlocked: 89,
    avgResolutionTime: 3.8,
    contentScore: 78
  };

  // Rapports de modération en attente
  const pendingReports = [
    {
      id: 1,
      type: 'inappropriate_content',
      severity: 'high',
      reportedBy: 'user234@example.com',
      contentType: 'property_description',
      contentId: 'PROP-001234',
      propertyTitle: 'Villa de luxe à Cocody',
      reportReason: 'Description contient des informations mensongères',
      reportedAt: '2025-10-23 12:45:00',
      status: 'pending',
      evidenceCount: 3,
      assignedTo: 'moderator@mon-toit.ci'
    },
    {
      id: 2,
      type: 'fake_listing',
      severity: 'critical',
      reportedBy: 'user567@example.com',
      contentType: 'property_images',
      contentId: 'PROP-001235',
      propertyTitle: 'Studio pas cher Abidjan',
      reportReason: 'Images ne correspondent pas à la propriété',
      reportedAt: '2025-10-23 12:30:00',
      status: 'pending',
      evidenceCount: 5,
      assignedTo: 'moderator@mon-toit.ci'
    },
    {
      id: 3,
      type: 'harassment',
      severity: 'critical',
      reportedBy: 'user890@example.com',
      contentType: 'user_messages',
      contentId: 'USER-001234',
      propertyTitle: 'Message privé avec locataire',
      reportReason: 'Messages inappropriés et menaces',
      reportedAt: '2025-10-23 11:15:00',
      status: 'pending',
      evidenceCount: 8,
      assignedTo: 'security@mon-toit.ci'
    },
    {
      id: 4,
      type: 'spam',
      severity: 'medium',
      reportedBy: 'system',
      contentType: 'multiple_listings',
      contentId: 'MULT-001',
      propertyTitle: 'Annonces suspectes',
      reportReason: 'Détection automatique de spam',
      reportedAt: '2025-10-23 10:30:00',
      status: 'pending',
      evidenceCount: 2,
      assignedTo: 'ai_moderator'
    }
  ];

  // Actions de modération récentes
  const recentActions = [
    {
      id: 1,
      type: 'content_removed',
      contentType: 'property_description',
      actionBy: 'moderator@mon-toit.ci',
      target: 'PROP-001236',
      reason: 'Description inexacte et trompeuse',
      action: 'removed',
      timestamp: '2025-10-23 11:45:00',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'user_suspended',
      contentType: 'user_profile',
      actionBy: 'admin@ansut.ci',
      target: 'USER-001235',
      reason: 'Multiple violations des conditions d\'utilisation',
      action: 'suspended',
      timestamp: '2025-10-23 10:20:00',
      severity: 'high'
    },
    {
      id: 3,
      type: 'content_approved',
      contentType: 'property_images',
      actionBy: 'moderator@mon-toit.ci',
      target: 'PROP-001237',
      reason: 'Vérification complétée - contenu valide',
      action: 'approved',
      timestamp: '2025-10-23 09:30:00',
      severity: 'low'
    }
  ];

  // Règles de modération automatique
  const moderationRules = [
    {
      id: 1,
      name: 'Détection de contenu inapproprié',
      description: 'Scanne automatique du texte pour mots-clés inappropriés',
      type: 'content_filter',
      enabled: true,
      threshold: 85,
      autoAction: 'flag_for_review',
      category: 'text_content'
    },
    {
      id: 2,
      name: 'Vérification d\'images',
      description: 'Analyse IA des images pour détecter contenu inapproprié',
      type: 'image_analysis',
      enabled: true,
      threshold: 70,
      autoAction: 'flag_for_review',
      category: 'image_content'
    },
    {
      id: 3,
      name: 'Détection de spam',
      description: 'Identification des comportements de spam',
      type: 'behavior_analysis',
      enabled: true,
      threshold: 90,
      autoAction: 'auto_block',
      category: 'user_behavior'
    }
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
      pending: 'destructive',
      in_review: 'default',
      resolved: 'secondary',
      blocked: 'destructive',
      approved: 'default'
    } as const;

    const labels = {
      pending: 'En attente',
      in_review: 'En examen',
      resolved: 'Résolu',
      blocked: 'Bloqué',
      approved: 'Approuvé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'property_description':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'property_images':
        return <Image className="h-4 w-4 text-purple-500" />;
      case 'user_messages':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'user_profile':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'removed':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <Ban className="h-4 w-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Edit className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag className="h-8 w-8 text-orange-700" />
            <div>
              <h1 className="text-3xl font-bold">Centre de Modération</h1>
              <p className="text-muted-foreground">Modération de contenu et comportements utilisateurs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Scanner
            </Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {moderationStats.pendingReview > 40 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">
              {moderationStats.pendingReview} rapports en attente
            </AlertTitle>
            <AlertDescription className="text-orange-700">
              Des rapports nécessitent une révision manuelle prioritaire.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rapports en attente</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{moderationStats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">
                Nécessite attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Résolus aujourd'hui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{moderationStats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {moderationStats.avgResolutionTime}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqués auto</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{moderationStats.autoBlocked}</div>
              <p className="text-xs text-muted-foreground">
                Par les règles IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de contenu</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{moderationStats.contentScore}%</div>
              <Progress value={moderationStats.contentScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="actions">Actions récentes</TabsTrigger>
            <TabsTrigger value="rules">Règles IA</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rapports en attente de modération</CardTitle>
                    <CardDescription>
                      Contenu signalé nécessitant un examen
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sévérité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
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
                  {pendingReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getContentTypeIcon(report.contentType)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{report.propertyTitle}</h4>
                              {getSeverityBadge(report.severity)}
                              {getStatusBadge(report.status)}
                              <Badge variant="outline" className="text-xs">
                                ID: {report.contentId}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mb-1">{report.reportReason}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Type: {report.contentType}</span>
                              <span>Signalé par: {report.reportedBy}</span>
                              <span>Preuves: {report.evidenceCount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Signalé: {report.reportedAt}</span>
                              <span>Assigné: {report.assignedTo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Examiner
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions de modération récentes</CardTitle>
                <CardDescription>
                  Historique des actions de modération appliquées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActionIcon(action.action)}
                        <div>
                          <p className="font-medium">
                            {action.target} - {action.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-muted-foreground">
                              {action.contentType} → {action.action}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{action.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Par {action.actionBy}</p>
                          {getSeverityBadge(action.severity)}
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(action.action)}
                          <Button size="sm" variant="outline">
                            <Archive className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Règles de modération automatique</CardTitle>
                <CardDescription>
                  Configuration des règles IA de détection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rule.name}</h4>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rule.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type:</p>
                              <p className="font-medium">{rule.type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Seuil de confiance:</p>
                              <div className="flex items-center gap-2">
                                <Progress value={rule.threshold} className="w-12" />
                                <span className="font-medium">{rule.threshold}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Action auto:</p>
                              <p className="font-medium">{rule.autoAction}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Tester
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
                  <CardTitle>Performance de modération</CardTitle>
                  <CardDescription>
                    Métriques sur l'efficacité du système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Temps moyen de résolution</span>
                    <span className="font-medium">{moderationStats.avgResolutionTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de résolution manuelle</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20" />
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Faux positifs évités</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Efficacité des règles IA</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution des rapports</CardTitle>
                  <CardDescription>
                    Répartition par type de contenu signalé
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Contenu inapproprié</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Fauxes annonces</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <Progress value={30} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Spam/Harcèlement</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <Progress value={15} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Autres</span>
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

export default AdminModerationPage;