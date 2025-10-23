import { Clock, Play, Pause, Square, RotateCcw, AlertTriangle, CheckCircle, XCircle, Activity, Database, FileText, Users, Zap, Server, RefreshCw, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminProcessingPage = () => {
  // Statistiques de traitement
  const processingStats = {
    totalJobs: 1247,
    runningJobs: 23,
    completedJobs: 892,
    failedJobs: 8,
    queuedJobs: 324,
    avgProcessingTime: 4.2,
    systemLoad: 67
  };

  // Jobs de traitement actifs
  const activeJobs = [
    {
      id: 1,
      name: 'Génération des rapports mensuels',
      type: 'report_generation',
      status: 'running',
      progress: 75,
      startedAt: '2025-10-23 12:30:00',
      estimatedCompletion: '2025-10-23 13:15:00',
      priority: 'high',
      worker: 'worker-01',
      retryCount: 0
    },
    {
      id: 2,
      name: 'Traitement des images properties',
      type: 'image_processing',
      status: 'running',
      progress: 45,
      startedAt: '2025-10-23 12:45:00',
      estimatedCompletion: '2025-10-23 13:30:00',
      priority: 'normal',
      worker: 'worker-03',
      retryCount: 1
    },
    {
      id: 3,
      name: 'Synchronisation base de données',
      type: 'database_sync',
      status: 'running',
      progress: 90,
      startedAt: '2025-10-23 11:00:00',
      estimatedCompletion: '2025-10-23 13:00:00',
      priority: 'critical',
      worker: 'worker-02',
      retryCount: 2
    },
    {
      id: 4,
      name: 'Envoi emails de notification',
      type: 'email_batch',
      status: 'failed',
      progress: 0,
      startedAt: '2025-10-23 12:50:00',
      estimatedCompletion: '-',
      priority: 'normal',
      worker: 'worker-04',
      retryCount: 3,
      error: 'SMTP connection timeout'
    }
  ];

  // Queue des jobs en attente
  const queuedJobs = [
    {
      id: 5,
      name: 'Nettoyage des logs anciens',
      type: 'maintenance',
      priority: 'low',
      queuedAt: '2025-10-23 12:55:00',
      estimatedDuration: '15 min'
    },
    {
      id: 6,
      name: 'Export des données utilisateurs',
      type: 'data_export',
      priority: 'normal',
      queuedAt: '2025-10-23 12:52:00',
      estimatedDuration: '45 min'
    },
    {
      id: 7,
      name: 'Mise à jour des index de recherche',
      type: 'search_index',
      priority: 'high',
      queuedAt: '2025-10-23 12:48:00',
      estimatedDuration: '30 min'
    }
  ];

  // Workers disponibles
  const workers = [
    {
      id: 'worker-01',
      name: 'Worker Processing Node 1',
      status: 'busy',
      currentJob: 'Génération rapports',
      cpuUsage: 85,
      memoryUsage: 67,
      jobsProcessed: 1247,
      lastHeartbeat: 'Il y a 30s'
    },
    {
      id: 'worker-02',
      name: 'Worker Processing Node 2',
      status: 'busy',
      currentJob: 'Sync DB',
      cpuUsage: 92,
      memoryUsage: 78,
      jobsProcessed: 892,
      lastHeartbeat: 'Il y a 15s'
    },
    {
      id: 'worker-03',
      name: 'Worker Processing Node 3',
      status: 'busy',
      currentJob: 'Processing images',
      cpuUsage: 45,
      memoryUsage: 56,
      jobsProcessed: 456,
      lastHeartbeat: 'Il y a 45s'
    },
    {
      id: 'worker-04',
      name: 'Worker Processing Node 4',
      status: 'idle',
      currentJob: '-',
      cpuUsage: 12,
      memoryUsage: 23,
      jobsProcessed: 789,
      lastHeartbeat: 'Il y a 10s'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default',
      completed: 'default',
      failed: 'destructive',
      queued: 'secondary',
      idle: 'secondary',
      busy: 'default'
    } as const;

    const labels = {
      running: 'En cours',
      completed: 'Terminé',
      failed: 'Échoué',
      queued: 'En attente',
      idle: 'Inactif',
      busy: 'Occupé'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive',
      high: 'default',
      normal: 'secondary',
      low: 'outline'
    } as const;

    const labels = {
      critical: 'Critique',
      high: 'Élevé',
      normal: 'Normal',
      low: 'Faible'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'report_generation':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'image_processing':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'database_sync':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'email_batch':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'maintenance':
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      case 'data_export':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'search_index':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold">Queue de Traitement</h1>
              <p className="text-muted-foreground">Monitoring des processus et jobs en cours</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Démarrer tout
            </Button>
          </div>
        </div>

        {/* Alertes critiques */}
        {processingStats.failedJobs > 5 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              {processingStats.failedJobs} jobs échoués détectés
            </AlertTitle>
            <AlertDescription className="text-red-700">
              Des jobs nécessitent une intervention manuelle. Consultez la section "Jobs actifs".
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs en cours</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{processingStats.runningJobs}</div>
              <p className="text-xs text-muted-foreground">
                Actuellement en exécution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs en attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{processingStats.queuedJobs}</div>
              <p className="text-xs text-muted-foreground">
                Dans la queue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs échoués</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{processingStats.failedJobs}</div>
              <p className="text-xs text-muted-foreground">
                Requiert attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Charge système</CardTitle>
              <Server className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{processingStats.systemLoad}%</div>
              <Progress value={processingStats.systemLoad} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Jobs actifs</TabsTrigger>
            <TabsTrigger value="queue">File d'attente</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Jobs de traitement actifs</CardTitle>
                    <CardDescription>
                      Surveillance des jobs en cours d'exécution
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="running">En cours</SelectItem>
                        <SelectItem value="failed">Échoués</SelectItem>
                        <SelectItem value="completed">Terminés</SelectItem>
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
                  {activeJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getJobTypeIcon(job.type)}
                          <div>
                            <h4 className="font-semibold">{job.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(job.status)}
                              {getPriorityBadge(job.priority)}
                              <Badge variant="outline" className="text-xs">
                                Worker: {job.worker}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {job.status === 'running' && (
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Square className="h-4 w-4 mr-1" />
                            Arrêter
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progression</span>
                          <span className="font-medium">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="w-full" />
                      </div>

                      {job.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="text-red-700">
                            <strong>Erreur:</strong> {job.error}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Démarré:</p>
                          <p className="font-medium">{job.startedAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimation:</p>
                          <p className="font-medium">{job.estimatedCompletion}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tentatives:</p>
                          <p className="font-medium">{job.retryCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Worker:</p>
                          <p className="font-medium">{job.worker}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>File d'attente</CardTitle>
                <CardDescription>
                  Jobs en attente de traitement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {queuedJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getJobTypeIcon(job.type)}
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getPriorityBadge(job.priority)}
                            <span className="text-xs text-muted-foreground">
                              Durée estimée: {job.estimatedDuration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">En attente depuis</p>
                        <p className="text-xs font-medium">{job.queuedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workers de traitement</CardTitle>
                <CardDescription>
                  Statut des nœuds de traitement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workers.map((worker) => (
                    <div key={worker.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5 text-blue-500" />
                          <div>
                            <h4 className="font-semibold">{worker.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(worker.status)}
                              <Badge variant="outline" className="text-xs">
                                {worker.lastHeartbeat}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Redémarrer
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Job actuel:</p>
                          <p className="font-medium">{worker.currentJob}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CPU:</p>
                          <div className="flex items-center gap-2">
                            <Progress value={worker.cpuUsage} className="w-12" />
                            <span className="font-medium">{worker.cpuUsage}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mémoire:</p>
                          <div className="flex items-center gap-2">
                            <Progress value={worker.memoryUsage} className="w-12" />
                            <span className="font-medium">{worker.memoryUsage}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Jobs traités:</p>
                          <p className="font-medium">{worker.jobsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dernier heartbeat:</p>
                          <p className="font-medium">{worker.lastHeartbeat}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance de traitement</CardTitle>
                  <CardDescription>
                    Métriques sur les performances de la queue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Temps moyen de traitement</span>
                    <span className="font-medium">{processingStats.avgProcessingTime}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de réussite</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Débit moyen</span>
                    <span className="font-medium">45 jobs/heure</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Temps d'attente moyen</span>
                    <span className="font-medium">2.3 min</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilisation des ressources</CardTitle>
                  <CardDescription>
                    Consommation des ressources système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>CPU Total</span>
                      <span className="font-medium">{processingStats.systemLoad}%</span>
                    </div>
                    <Progress value={processingStats.systemLoad} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Mémoire</span>
                      <span className="font-medium">72%</span>
                    </div>
                    <Progress value={72} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Disque</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Réseau</span>
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

export default AdminProcessingPage;