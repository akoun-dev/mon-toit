import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Wrench, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { MaintenanceRequest } from '@/types/owner';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  showActions?: boolean;
}

export const MaintenanceRequestCard: React.FC<MaintenanceRequestCardProps> = ({
  request,
  showActions = true
}) => {
  const { approveRequest, startWork, completeRequest, rejectRequest } = useMaintenanceRequests();

  const getStatusIcon = () => {
    switch (request.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = () => {
    switch (request.priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = () => {
    // Ouvrir un dialogue pour approuver avec notes et coût estimé
    const notes = prompt('Notes pour l\'approbation:');
    const cost = prompt('Coût estimé (optionnel):');

    approveRequest({
      requestId: request.id,
      notes: notes || undefined,
      estimatedCost: cost ? parseFloat(cost) : undefined,
    });
  };

  const handleStartWork = () => {
    startWork({ requestId: request.id });
  };

  const handleComplete = () => {
    const cost = prompt('Coût réel des travaux:');
    const notes = prompt('Notes de complétion:');

    completeRequest({
      requestId: request.id,
      actualCost: cost ? parseFloat(cost) : undefined,
      notes: notes || undefined,
    });
  };

  const handleReject = () => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      rejectRequest({ requestId: request.id, reason });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span>{request.property?.title}</span>
              {request.property?.address && (
                <span>• {request.property.address}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor()}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span>{request.status}</span>
              </div>
            </Badge>
            <Badge variant="outline" className={getPriorityColor()}>
              {request.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {request.description}
        </p>

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>
              {request.tenant?.full_name || 'Propriétaire'}
            </span>
          </div>
          {request.category && (
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>{request.category}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(request.created_at), 'PPp', { locale: fr })}
            </span>
          </div>
          {request.scheduled_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Prévu: {format(new Date(request.scheduled_date), 'PP', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Coûts */}
        {(request.estimated_cost || request.actual_cost) && (
          <div className="space-y-1">
            {request.estimated_cost && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coût estimé:</span>
                <span className="font-medium">
                  {request.estimated_cost.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
            {request.actual_cost && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coût réel:</span>
                <span className="font-medium">
                  {request.actual_cost.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {request.owner_notes && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Notes du propriétaire:</p>
            <p className="text-sm text-muted-foreground">{request.owner_notes}</p>
          </div>
        )}
        {request.tenant_notes && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Notes du locataire:</p>
            <p className="text-sm text-muted-foreground">{request.tenant_notes}</p>
          </div>
        )}

        {/* Images */}
        {request.images && request.images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Images:</p>
            <div className="flex gap-2 overflow-x-auto">
              {request.images.map((image, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            {request.status === 'pending' && (
              <>
                <Button onClick={handleApprove} size="sm" className="flex-1">
                  Approuver
                </Button>
                <Button
                  onClick={handleReject}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  Rejeter
                </Button>
              </>
            )}
            {request.status === 'approved' && (
              <Button onClick={handleStartWork} size="sm" className="flex-1">
                Commencer les travaux
              </Button>
            )}
            {request.status === 'in_progress' && (
              <Button onClick={handleComplete} size="sm" className="flex-1">
                Marquer comme terminé
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};