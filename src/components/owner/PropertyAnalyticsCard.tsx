import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  Users,
  Heart,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { PropertyAnalytics } from '@/types/owner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PropertyAnalyticsCardProps {
  analytics: PropertyAnalytics;
  onViewDetails?: (propertyId: string) => void;
  showTrends?: boolean;
}

export const PropertyAnalyticsCard: React.FC<PropertyAnalyticsCardProps> = ({
  analytics,
  onViewDetails,
  showTrends = true
}) => {
  const getStatusColor = () => {
    switch (analytics.status) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'loué':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'négociation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = () => {
    if (analytics.property_score >= 80) return 'text-green-600';
    if (analytics.property_score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-2">{analytics.property_title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>{formatCurrency(analytics.monthly_rent)}/mois</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getStatusColor()}>
              {analytics.status}
            </Badge>
            <div className={`text-sm font-medium ${getScoreColor()}`}>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{analytics.property_score}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image de la propriété */}
        {analytics.property_image && (
          <div className="mt-3">
            <img
              src={analytics.property_image}
              alt={analytics.property_title}
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Vues</span>
            </div>
            <div className="text-2xl font-bold">{analytics.views_total.toLocaleString('fr-FR')}</div>
            {showTrends && (
              <div className="text-xs text-muted-foreground">
                +{analytics.views_7d} cette semaine
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Candidatures</span>
            </div>
            <div className="text-2xl font-bold">{analytics.applications_count}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.applications_pending} en attente
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Favoris</span>
            </div>
            <div className="text-2xl font-bold">{analytics.favorites_count}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Conversion</span>
            </div>
            <div className="text-2xl font-bold">{analytics.conversion_rate}%</div>
            <Progress value={analytics.conversion_rate} className="h-2" />
          </div>
        </div>

        {/* Score de performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score de performance</span>
            <span className={`text-sm font-medium ${getScoreColor()}`}>
              {analytics.property_score}/100
            </span>
          </div>
          <Progress value={analytics.property_score} className="h-2" />
        </div>

        {/* Temps de réponse moyen */}
        {analytics.average_response_time_hours > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Temps de réponse moyen:</span>
            <span className="font-medium">
              {formatResponseTime(analytics.average_response_time_hours)}
            </span>
          </div>
        )}

        {/* Dernière vue */}
        {analytics.last_view_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-muted-foreground">Dernière vue:</span>
            <span className="font-medium">
              {format(new Date(analytics.last_view_date), 'PP', { locale: fr })}
            </span>
          </div>
        )}

        {/* Statistiques détaillées */}
        {showTrends && (
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-sm font-medium">Tendances (30 jours)</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted p-2 rounded">
                <div className="text-lg font-bold">{analytics.views_30d}</div>
                <div className="text-xs text-muted-foreground">Vues</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-lg font-bold">{analytics.applications_approved}</div>
                <div className="text-xs text-muted-foreground">Approuvées</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-lg font-bold">{analytics.applications_pending}</div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </div>
            </div>
          </div>
        )}

        {/* Alertes et actions recommandées */}
        {analytics.property_score < 50 && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
            <h4 className="text-sm font-medium text-orange-800 mb-1">
              ⚠️ Attention requise
            </h4>
            <p className="text-xs text-orange-700">
              Cette propriété a un score de performance faible. Considérez l'optimisation des photos,
              le prix ou la description pour améliorer son attractivité.
            </p>
          </div>
        )}

        {analytics.applications_pending > 5 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              📋 Plusieurs candidatures en attente
            </h4>
            <p className="text-xs text-blue-700">
              {analytics.applications_pending} candidatures nécessitent votre attention.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(analytics.property_id)}
          >
            Voir détails
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(analytics.property_id)}
          >
            Gérer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};