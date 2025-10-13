import { useState } from 'react';
import { useVisitRequests, useRespondToRequest } from '@/hooks/useVisitRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AgentRequestDashboardProps {
  propertyId?: string;
}

export const AgentRequestDashboard = ({ propertyId }: AgentRequestDashboardProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const { data: requests, isLoading } = useVisitRequests({
    propertyId,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });
  const respondToRequest = useRespondToRequest();

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Priorité haute';
    if (score >= 50) return 'Priorité moyenne';
    return 'Priorité basse';
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandes de visite</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="pending">
                <Clock className="mr-2 h-4 w-4" />
                En attente
              </TabsTrigger>
              <TabsTrigger value="accepted">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Acceptées
              </TabsTrigger>
              <TabsTrigger value="declined">
                <XCircle className="mr-2 h-4 w-4" />
                Refusées
              </TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="space-y-4 mt-6">
              {requests && requests.length > 0 ? (
                requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.profiles?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{request.profiles?.full_name}</h3>
                              {request.profiles?.is_verified && (
                                <Award className="h-4 w-4 text-blue-500" />
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge className={getScoreBadgeColor(request.priority_score)}>
                                <TrendingUp className="mr-1 h-3 w-3" />
                                {getScoreLabel(request.priority_score)} ({request.priority_score}/100)
                              </Badge>
                              {request.profiles?.oneci_verified && (
                                <Badge variant="outline">ONECI vérifié</Badge>
                              )}
                              {request.profiles?.cnam_verified && (
                                <Badge variant="outline">CNAM vérifié</Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {request.request_type === 'flexible' ? 'Disponibilité flexible' : 'Créneau spécifique'}
                              {' • '}
                              {request.visitor_count} visiteur{request.visitor_count > 1 ? 's' : ''}
                            </p>

                            {request.motivation && (
                              <p className="text-sm">{request.motivation}</p>
                            )}

                            {request.availability_notes && (
                              <p className="text-sm text-muted-foreground">
                                Disponibilité: {request.availability_notes}
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground">
                              Reçu {formatDistanceToNow(new Date(request.created_at), {
                                addSuffix: true,
                                locale: fr
                              })}
                              {' • '}
                              Expire {formatDistanceToNow(new Date(request.expires_at), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                respondToRequest.mutate({
                                  requestId: request.id,
                                  status: 'accepted',
                                  agentResponse: 'Demande acceptée. Nous vous proposerons des créneaux sous peu.',
                                });
                              }}
                              disabled={respondToRequest.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                respondToRequest.mutate({
                                  requestId: request.id,
                                  status: 'declined',
                                  agentResponse: 'Désolé, nous ne pouvons pas donner suite à votre demande pour le moment.',
                                });
                              }}
                              disabled={respondToRequest.isPending}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune demande pour le moment
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
