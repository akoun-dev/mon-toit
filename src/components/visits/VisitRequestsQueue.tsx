import { useState } from "react";
import { useVisitRequests, useUpdateVisitRequest } from "@/hooks/useVisitRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisitRequestsQueueProps {
  propertyId?: string;
}

export function VisitRequestsQueue({ propertyId }: VisitRequestsQueueProps) {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [agentResponse, setAgentResponse] = useState("");

  const { data: requests, isLoading } = useVisitRequests({
    propertyId,
    status: activeTab === "all" ? undefined : activeTab,
    sortByPriority: activeTab === "pending",
  });

  const updateRequest = useUpdateVisitRequest();

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50";
    if (score >= 50) return "text-orange-600 bg-orange-50";
    return "text-blue-600 bg-blue-50";
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return { label: "Haute priorité", icon: Flame };
    if (score >= 50) return { label: "Priorité moyenne", icon: TrendingUp };
    return { label: "Priorité standard", icon: Clock };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "default", label: "En attente", icon: Clock },
      accepted: { variant: "secondary", label: "Acceptée", icon: CheckCircle2 },
      declined: { variant: "destructive", label: "Refusée", icon: XCircle },
      expired: { variant: "outline", label: "Expirée", icon: AlertCircle },
      converted: { variant: "default", label: "Convertie", icon: CheckCircle2 },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setAgentResponse("");
    setResponseDialogOpen(true);
  };

  const handleDeclineRequest = (request: any) => {
    setSelectedRequest(request);
    setAgentResponse("");
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async (action: 'accepted' | 'declined') => {
    if (!selectedRequest) return;

    await updateRequest.mutateAsync({
      requestId: selectedRequest.id,
      updates: {
        status: action,
        agent_response: agentResponse,
      },
    });

    setResponseDialogOpen(false);
    setSelectedRequest(null);
    setAgentResponse("");
  };

  const ScoreBreakdownTooltip = ({ breakdown }: { breakdown: any }) => {
    if (!breakdown) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Shield className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-2 text-sm">
              <div className="font-semibold">Détail du score de priorité</div>
              {breakdown.identity_verified && (
                <div className="flex justify-between">
                  <span>Identité vérifiée</span>
                  <span className="font-medium">+{breakdown.identity_score}</span>
                </div>
              )}
              {breakdown.cnam_verified && (
                <div className="flex justify-between">
                  <span>CNAM vérifié</span>
                  <span className="font-medium">+{breakdown.cnam_score}</span>
                </div>
              )}
              {breakdown.account_age_score > 0 && (
                <div className="flex justify-between">
                  <span>Compte ancien ({breakdown.account_age_days}j)</span>
                  <span className="font-medium">+{breakdown.account_age_score}</span>
                </div>
              )}
              {breakdown.has_applications && (
                <div className="flex justify-between">
                  <span>Historique ({breakdown.application_count})</span>
                  <span className="font-medium">+{breakdown.applications_score}</span>
                </div>
              )}
              {breakdown.complete_verification && (
                <div className="flex justify-between">
                  <span>Vérification complète</span>
                  <span className="font-medium">+{breakdown.complete_verification_score}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between font-semibold">
                <span>Total</span>
                <span>{breakdown.total_score}/100</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const RequestCard = ({ request }: { request: any }) => {
    const priority = getPriorityLabel(request.priority_score);
    const PriorityIcon = priority.icon;
    const isExpiringSoon =
      new Date(request.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {request.property?.title || 'Propriété'}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                {request.property?.city || 'Ville inconnue'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                  getPriorityColor(request.priority_score)
                )}
              >
                <PriorityIcon className="h-3 w-3" />
                {request.priority_score}
              </div>
              <ScoreBreakdownTooltip breakdown={request.score_breakdown?.breakdown} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{request.requester?.full_name || 'Anonyme'}</div>
                {request.requester?.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{request.visitor_count} visiteur{request.visitor_count > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{request.request_type === 'flexible' ? 'Dates flexibles' : 'Créneau spécifique'}</span>
          </div>

          {request.motivation && (
            <div className="flex gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground line-clamp-2">{request.motivation}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {getStatusBadge(request.status)}
              {request.status === 'pending' && isExpiringSoon && (
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Expire bientôt
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Il y a {formatDistanceToNow(new Date(request.created_at), { locale: fr })}
            </span>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleAcceptRequest(request)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeclineRequest(request)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Refuser
              </Button>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="text-xs text-muted-foreground text-center">
              Expire le {new Date(request.expires_at).toLocaleString('fr-FR')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;
  const acceptedCount = requests?.filter((r) => r.status === "accepted").length || 0;

  return (
    <div className="space-y-6">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Demandes de visite</AlertTitle>
        <AlertDescription>
          Les demandes sont automatiquement expirées après 48 heures sans réponse.
          Les demandeurs sont notifiés par email.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            En attente
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Acceptées
            {acceptedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {acceptedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="declined">Refusées</TabsTrigger>
          <TabsTrigger value="expired">Expirées</TabsTrigger>
          <TabsTrigger value="all">Toutes</TabsTrigger>
        </TabsList>

        {["pending", "accepted", "declined", "expired", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {requests && requests.length > 0 ? (
              requests.map((request) => <RequestCard key={request.id} request={request} />)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucune demande de visite pour le moment
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === 'pending' ? 'Répondre à la demande' : 'Détails'}
            </DialogTitle>
            <DialogDescription>
              Demande de {selectedRequest?.requester?.full_name || 'Anonyme'} pour{' '}
              {selectedRequest?.property?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="response">Votre message</Label>
              <Textarea
                id="response"
                placeholder="Expliquez votre décision au demandeur..."
                value={agentResponse}
                onChange={(e) => setAgentResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSubmitResponse('declined')}
              disabled={updateRequest.isPending}
            >
              Refuser
            </Button>
            <Button
              onClick={() => handleSubmitResponse('accepted')}
              disabled={updateRequest.isPending}
            >
              Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
