import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentRequestDashboard } from '@/components/visits/AgentRequestDashboard';
import { VisitPipeline } from '@/components/visits/VisitPipeline';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUps } from '@/hooks/useFollowUps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Inbox, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const VisitsCRM = () => {
  const { user } = useAuth();
  const { data: followUps } = useFollowUps({
    agentId: user?.id,
    status: 'pending',
  });

  const pendingFollowUps = followUps?.filter((f) => f.status === 'pending') || [];
  const overdueFollowUps = followUps?.filter((f) => f.status === 'overdue') || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">CRM Visites</h1>
          <p className="text-muted-foreground">
            Gérez vos demandes de visite, annotations et suivis prospects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches en attente</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingFollowUps.length}</div>
              <p className="text-xs text-muted-foreground">
                {overdueFollowUps.length} en retard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes du jour</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nouveaux prospects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">
              <Inbox className="mr-2 h-4 w-4" />
              Demandes
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="followups">
              <Calendar className="mr-2 h-4 w-4" />
              Suivis ({pendingFollowUps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <AgentRequestDashboard />
          </TabsContent>

          <TabsContent value="pipeline">
            <VisitPipeline />
          </TabsContent>

          <TabsContent value="followups">
            <Card>
              <CardHeader>
                <CardTitle>Tâches de suivi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingFollowUps.length > 0 ? (
                  pendingFollowUps.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{task.task_subject}</h3>
                              <Badge variant="outline">{task.contact_method}</Badge>
                              {task.status === 'overdue' && (
                                <Badge variant="destructive">En retard</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prévu {formatDistanceToNow(new Date(task.scheduled_date), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                            {task.task_notes && (
                              <p className="text-sm">{task.task_notes}</p>
                            )}
                          </div>
                          <Button size="sm">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marquer terminé
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune tâche de suivi pour le moment
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default VisitsCRM;
