import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  Eye,
  Users,
  Heart,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { OwnerDashboardStats } from '@/types/owner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OwnerDashboardStatsProps {
  stats: OwnerDashboardStats;
}

export const OwnerDashboardStats: React.FC<OwnerDashboardStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j`;
  };

  const urgentActions = Array.isArray(stats.urgent_actions) ? stats.urgent_actions : [];
  const topProperties = Array.isArray(stats.top_performing_properties) ? stats.top_performing_properties : [];

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biens</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_properties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.available_properties} disponibles • {stats.rented_properties} loués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_views.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois: {stats.monthly_trends?.views_this_month || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending_applications} en attente • {stats.approved_applications} approuvées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Taux occupation: {stats.occupied_percentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.occupied_percentage}%</div>
              <Progress value={stats.occupied_percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.rented_properties} sur {stats.total_properties} biens loués
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyer moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.average_monthly_rent)}</div>
            <p className="text-xs text-muted-foreground">
              Par mois, tous biens confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatResponseTime(stats.average_response_time_hours)}
            </div>
            <p className="text-xs text-muted-foreground">
              Temps moyen pour répondre aux candidatures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions urgentes */}
      {urgentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Actions urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      action.priority === 'high' ? 'bg-red-500' :
                      action.priority === 'medium' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Badge variant={
                    action.priority === 'high' ? 'destructive' :
                    action.priority === 'medium' ? 'default' :
                    'secondary'
                  }>
                    {action.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biens les plus performants */}
      {topProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Biens les plus performants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProperties.slice(0, 5).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{property.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.views} vues • {property.applications} candidatures
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(property.monthly_rent)}</p>
                    <p className="text-sm text-muted-foreground">/ mois</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé mensuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Résumé du mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.monthly_trends?.views_this_month || 0}
              </div>
              <p className="text-sm text-blue-700">Vues ce mois</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.monthly_trends?.applications_this_month || 0}
              </div>
              <p className="text-sm text-green-700">Candidatures ce mois</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.monthly_trends?.favorites_this_month || 0}
              </div>
              <p className="text-sm text-purple-700">Favoris ce mois</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statuts des propriétés */}
      {stats.properties_by_status && Object.keys(stats.properties_by_status).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.properties_by_status).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span>{count}</span>
                  </div>
                  <Progress
                    value={(count / stats.total_properties) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};