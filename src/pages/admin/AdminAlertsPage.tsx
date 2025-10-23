import { Bell, AlertTriangle, Home, Eye, Clock, CheckCircle, XCircle, AlertCircle, Users, Calendar, Filter, RefreshCw, Settings, Activity, TrendingUp, MapPin } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminAlertsPage = () => {
  // Statistiques des alertes
  const alertStats = {
    totalAlerts: 342,
    criticalAlerts: 23,
    unacknowledged: 45,
    resolvedToday: 89,
    avgResolutionTime: 4.2,
    activeRules: 12
  };

  // Alertes actives
  const activeAlerts = [
    {
      id: 1,
      type: 'property_anomaly',
      severity: 'critical',
      property: 'Villa 4 chambres, Riviera',
      description: 'Anomalie détectée dans les données de propriété',
      details: 'Prix inhabituellement bas par rapport au marché',
      detectedAt: '2025-10-23 12:45:00',
      status: 'unacknowledged',
      assignedTo: 'admin@ansut.ci',
      location: 'Riviera',
      propertyId: 'PROP-001234'
    },
    {
      id: 2,
      type: 'suspicious_activity',
      severity: 'high',
      property: 'Studio, Plateau',
      description: 'Activité suspecte sur une propriété',
      details: 'Multiples vues du même utilisateur en peu de temps',
      detectedAt: '2025-10-23 12:30:00',
      status: 'acknowledged',
      assignedTo: 'security@mon-toit.ci',
      location: 'Plateau',
      propertyId: 'PROP-001235'
    },
    {
      id: 3,
      type: 'listing_expiry',
      severity: 'medium',
      property: 'Appartement F2, Cocody',
      description: 'Annonce bientôt expirée',
      details: 'L\'annonce expire dans 3 jours',
      detectedAt: '2025-10-23 11:00:00',
      status: 'acknowledged',
      assignedTo: 'system',
      location: 'Cocody',
      propertyId: 'PROP-001236'
    },
    {
      id: 4,
      type: 'price_anomaly',
      severity: 'low',
      property: 'T2, Yopougon',
      description: 'Variation de prix détectée',
      details: 'Le prix a été modifié de -30%',
      detectedAt: '2025-10-23 10:15:00',
      status: 'acknowledged',
      assignedTo: 'agence@mon-toit.ci',
      location: 'Yopougon',
      propertyId: 'PROP-001237'
    }
  ];

  // Règles d'alerte
  const alertRules = [
    {
      id: 1,
      name: 'Détection d\'anomalie de prix',
      description: 'Alerte lorsque le prix varie de plus de 25%',
      type: 'price_anomaly',
      enabled: true,
      severity: 'medium',
      threshold: 25,
      lastTriggered: '2025-10-23 10:15:00',
      triggerCount: 12
    },
    {
      id: 2,
      name: 'Activité suspecte',
      description: 'Détection de comportements anormaux',
      type: 'suspicious_activity',
      enabled: true,
      severity: 'high',
      threshold: 50,
      lastTriggered: '2025-10-23 12:30:00',
      triggerCount: 8
    },
    {
      id: 3,
      name: 'Expiration d\'annonce',
      description: 'Alerte avant expiration des annonces',
      type: 'listing_expiry',
      enabled: true,
      severity: 'low',
      threshold: 3,
      lastTriggered: '2025-10-23 11:00:00',
      triggerCount: 234
    }
  ];

  // Alertes résolues récemment
  const recentResolutions = [
    {
      id: 1,
      alertType: 'property_anomaly',
      property: 'Duplex, Marcory',
      resolution: 'Données corrigées',
      resolvedBy: 'admin@ansut.ci',
      resolvedAt: '2025-10-23 11:30:00',
      timeToResolve: '2.5h'
    },
    {
      id: 2,
      alertType: 'suspicious_activity',
      property: 'Studio, Treichville',
      resolution: 'Activité légitime confirmée',
      resolvedBy: 'security@mon-toit.ci',
      resolvedAt: '2025-10-23 10:45:00',
      timeToResolve: '1.2h'
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
      unacknowledged: 'destructive',
      acknowledged: 'default',
      resolved: 'secondary',
      investigating: 'default'
    } as const;

    const labels = {
      unacknowledged: 'Non acquittée',
      acknowledged: 'Acquittée',
      resolved: 'Résolue',
      investigating: 'En investigation'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'property_anomaly':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'suspicious_activity':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'listing_expiry':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'price_anomaly':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-bold">Alertes Propriétés</h1>
              <p className="text-muted-foreground">Système de surveillance immobilière</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {alertStats.criticalAlerts > 20 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              {alertStats.criticalAlerts} alertes critiques détectées
            </AlertTitle>
            <AlertDescription className="text-red-700">
              Des alertes de haute priorité nécessitent une attention immédiate.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{alertStats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Total des alertes actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertStats.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Action immédiate requise
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non acquittées</CardTitle>
              <XCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{alertStats.unacknowledged}</div>
              <p className="text-xs text-muted-foreground">
                En attente d'action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Résolues aujourd'hui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{alertStats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">
                Moyenne: {alertStats.avgResolutionTime}h
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Alertes actives</TabsTrigger>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="resolved">Résolues</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alertes actives</CardTitle>
                    <CardDescription>
                      Alertes nécessitant une attention
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
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getAlertTypeIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{alert.property}</h4>
                              {getSeverityBadge(alert.severity)}
                              {getStatusBadge(alert.status)}
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {alert.location}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mb-1">{alert.description}</p>
                            <p className="text-sm text-muted-foreground mb-2">{alert.details}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>ID: {alert.propertyId}</span>
                              <span>Détecté: {alert.detectedAt}</span>
                              <span>Assigné: {alert.assignedTo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {alert.status === 'unacknowledged' && (
                            <Button size="sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Acquitter
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
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
                <CardTitle>Règles d'alerte</CardTitle>
                <CardDescription>
                  Configuration des règles de détection automatique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rule.name}</h4>
                            {getSeverityBadge(rule.severity)}
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type:</p>
                              <p className="font-medium">{rule.type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Seuil:</p>
                              <p className="font-medium">{rule.threshold}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Déclenchements:</p>
                              <p className="font-medium">{rule.triggerCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dernier:</p>
                              <p className="font-medium">{rule.lastTriggered}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4 mr-1" />
                            Configurer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertes résolues récemment</CardTitle>
                <CardDescription>
                  Historique des alertes traitées aujourd'hui
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentResolutions.map((resolution) => (
                    <div key={resolution.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{resolution.property}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-muted-foreground">
                              {resolution.alertType} → {resolution.resolution}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{resolution.timeToResolve}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Par {resolution.resolvedBy}</p>
                        <p className="text-xs text-muted-foreground">{resolution.resolvedAt}</p>
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
                  <CardTitle>Performance des alertes</CardTitle>
                  <CardDescription>
                    Métriques sur l'efficacité du système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Temps moyen de résolution</span>
                    <span className="font-medium">{alertStats.avgResolutionTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de résolution journalier</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Faux positifs</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Règles actives</span>
                    <span className="font-medium">{alertStats.activeRules}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution par type</CardTitle>
                  <CardDescription>
                    Répartition des alertes par catégorie
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Anomalies de prix</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Activité suspecte</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <Progress value={25} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Expiration d'annonces</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <Progress value={20} />
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

export default AdminAlertsPage;