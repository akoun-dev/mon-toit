import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { LeaseCertificationData } from '@/hooks/useOwnerLeaseCertification';

interface CertificationActionsCardProps {
  leases: LeaseCertificationData[];
}

interface Action {
  id: string;
  icon: typeof AlertCircle;
  title: string;
  description: string;
  priority: 'critical' | 'important' | 'info';
  count: number;
  actionLabel: string;
}

export const CertificationActionsCard = ({ leases }: CertificationActionsCardProps) => {
  const now = new Date();

  const actions: Action[] = [];

  // Baux actifs non certifiés
  const activeLeasesNotCertified = leases.filter(
    l => l.lease_status === 'active' && l.certification_status === 'not_requested'
  ).length;
  
  if (activeLeasesNotCertified > 0) {
    actions.push({
      id: 'not-certified',
      icon: AlertCircle,
      title: `${activeLeasesNotCertified} bail${activeLeasesNotCertified > 1 ? 'x' : ''} actif${activeLeasesNotCertified > 1 ? 's' : ''} non certifié${activeLeasesNotCertified > 1 ? 's' : ''}`,
      description: 'Demandez la certification pour sécuriser vos baux',
      priority: 'important',
      count: activeLeasesNotCertified,
      actionLabel: 'Demander certification',
    });
  }

  // Demandes en attente >7 jours
  const pendingOverdue = leases.filter(l => {
    if (l.certification_status !== 'pending' || !l.certification_requested_at) return false;
    const requested = new Date(l.certification_requested_at);
    const daysSince = (now.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 7;
  }).length;

  if (pendingOverdue > 0) {
    actions.push({
      id: 'pending-overdue',
      icon: Clock,
      title: `${pendingOverdue} demande${pendingOverdue > 1 ? 's' : ''} en attente >7 jours`,
      description: 'Relancez l\'administration pour accélérer le traitement',
      priority: 'critical',
      count: pendingOverdue,
      actionLabel: 'Relancer',
    });
  }

  // Baux rejetés
  const rejectedLeases = leases.filter(l => l.certification_status === 'rejected').length;
  
  if (rejectedLeases > 0) {
    actions.push({
      id: 'rejected',
      icon: XCircle,
      title: `${rejectedLeases} bail${rejectedLeases > 1 ? 'x' : ''} rejeté${rejectedLeases > 1 ? 's' : ''}`,
      description: 'Consultez les notes et corrigez les problèmes',
      priority: 'important',
      count: rejectedLeases,
      actionLabel: 'Voir détails',
    });
  }

  // Baux certifiés expirant dans <60 jours
  const certifiedExpiringSoon = leases.filter(l => {
    if (l.certification_status !== 'certified') return false;
    const endDate = new Date(l.end_date);
    const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 60;
  }).length;

  if (certifiedExpiringSoon > 0) {
    actions.push({
      id: 'expiring-soon',
      icon: CheckCircle,
      title: `${certifiedExpiringSoon} bail${certifiedExpiringSoon > 1 ? 'x' : ''} certifié${certifiedExpiringSoon > 1 ? 's' : ''} expirant bientôt`,
      description: 'Préparez le renouvellement dans les 60 jours',
      priority: 'info',
      count: certifiedExpiringSoon,
      actionLabel: 'Préparer renouvellement',
    });
  }

  const priorityConfig = {
    critical: { bgColor: 'bg-destructive/10', textColor: 'text-destructive', badgeVariant: 'destructive' as const },
    important: { bgColor: 'bg-warning/10', textColor: 'text-warning', badgeVariant: 'default' as const },
    info: { bgColor: 'bg-primary/10', textColor: 'text-primary', badgeVariant: 'secondary' as const },
  };

  if (actions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Actions Recommandées
          </CardTitle>
          <CardDescription>
            Aucune action urgente requise
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
            <p className="font-medium">Tout est en ordre !</p>
            <p className="text-sm">Tous vos baux sont à jour</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Actions Recommandées
        </CardTitle>
        <CardDescription>
          {actions.length} action{actions.length > 1 ? 's' : ''} à traiter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const config = priorityConfig[action.priority];
          const Icon = action.icon;
          
          return (
            <div 
              key={action.id}
              className={`${config.bgColor} rounded-lg p-3 space-y-2 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <Icon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Badge variant={config.badgeVariant} className="shrink-0">
                  {action.count}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                {action.actionLabel}
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
