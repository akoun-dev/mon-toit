import { Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BRANDING } from '@/config/branding';

interface LeaseVerificationBadgeProps {
  status: 'not_requested' | 'pending' | 'certified' | 'rejected';
  verifiedAt?: string | null;
  variant?: 'default' | 'detailed' | 'compact';
}

const LeaseVerificationBadge = ({ status, verifiedAt, variant = 'default' }: LeaseVerificationBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'certified':
        return {
          icon: CheckCircle,
          text: 'Bail vérifié',
          color: 'bg-green-600 hover:bg-green-700',
          iconColor: 'text-white',
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Vérification en cours',
          color: 'bg-yellow-600 hover:bg-yellow-700',
          iconColor: 'text-white',
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Vérification refusée',
          color: 'bg-red-600 hover:bg-red-700',
          iconColor: 'text-white',
        };
      default:
        return {
          icon: Shield,
          text: 'Non vérifié',
          color: 'bg-muted hover:bg-muted/80',
          iconColor: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge className={`${config.color} gap-1.5 text-xs px-2 py-1`}>
        <Icon className="h-3 w-3" />
        <span>{BRANDING.VERIFICATION_SYSTEM.badge}</span>
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`inline-flex items-center gap-2 ${config.color} px-4 py-2 rounded-lg text-white transition-smooth`}>
        <Icon className="h-5 w-5" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{config.text}</span>
          {status === 'certified' && verifiedAt && (
            <span className="text-xs opacity-90">
              Le {new Date(verifiedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} cursor-help gap-2`}>
            <Icon className="h-4 w-4" />
            {config.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {status === 'certified' && (
            <div className="space-y-1">
              <p className="font-semibold">Bail validé par {BRANDING.VERIFICATION_SYSTEM.team}</p>
              {verifiedAt && (
                <p className="text-xs">
                  Vérifié le {new Date(verifiedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <p className="text-xs">Conforme aux normes légales burkinabè</p>
            </div>
          )}
          {status === 'pending' && (
            <div className="space-y-1">
              <p className="font-semibold">Vérification en cours</p>
              <p className="text-xs">Demande en cours d'examen par {BRANDING.VERIFICATION_SYSTEM.team} (2-5 jours)</p>
            </div>
          )}
          {status === 'rejected' && (
            <div className="space-y-1">
              <p className="font-semibold">Vérification refusée</p>
              <p className="text-xs">Consultez les notes pour plus de détails</p>
            </div>
          )}
          {status === 'not_requested' && (
            <div className="space-y-1">
              <p className="font-semibold">Pas de vérification demandée</p>
              <p className="text-xs">Ce bail n'a pas demandé de vérification</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LeaseVerificationBadge;
