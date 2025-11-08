import { FileText, ShieldCheck, Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OwnerCertificationStats } from '@/hooks/useOwnerLeaseCertification';

interface LeaseCertificationStatsProps {
  stats: OwnerCertificationStats;
}

export const LeaseCertificationStats = ({ stats }: LeaseCertificationStatsProps) => {
  const statItems = [
    { 
      title: 'Total Baux', 
      value: stats.total_leases, 
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Certifiés',
      value: stats.certified_count,
      icon: ShieldCheck,
      color: 'text-success'
    },
    { 
      title: 'En attente', 
      value: stats.pending_count, 
      icon: Clock,
      color: 'text-warning'
    },
    { 
      title: 'Taux certification', 
      value: `${stats.certification_rate}%`, 
      icon: TrendingUp,
      color: 'text-success'
    },
    { 
      title: 'Temps moyen', 
      value: `${stats.avg_processing_days}j`, 
      icon: Calendar,
      color: 'text-muted-foreground'
    },
    {
      title: 'Actions urgentes',
      value: stats.urgent_actions,
      icon: AlertCircle,
      color: stats.urgent_actions > 0 ? 'text-destructive' : 'text-muted-foreground'
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {statItems.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold truncate">{stat.value}</div>
                <div className="text-xs text-muted-foreground truncate">{stat.title}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
