import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, MapPin, Clock, DollarSign, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/services/logger';

interface MarketTrend {
  city: string;
  avg_price_per_sqm: number;
  total_properties: number;
  avg_rent: number;
  trend_percentage: number;
  similar_cheaper_cities: string[];
  avg_rental_days: number;
}

interface MarketInsightsData {
  summary?: {
    average_rent: number;
    properties_count: number;
    popular_neighborhoods: string[];
    price_trend: string;
    demand_level: string;
  };
  monthly_trends?: Array<{
    month: string;
    average_rent: number;
    properties_count: number;
  }>;
  neighborhood_stats?: Array<{
    neighborhood: string;
    average_rent: number;
    properties_count: number;
    price_trend: string;
  }>;
  recommendations?: Array<{
    type: string;
    area: string;
    reason: string;
  }>;
  generated_at?: string;
  message?: string;
}

interface MarketInsightsWidgetProps {
  className?: string;
}

export const MarketInsightsWidget = ({ className }: MarketInsightsWidgetProps) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<MarketInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try RPC function first, fallback to Edge Function
        let { data, error: rpcError } = await supabase.rpc('analyze_market_trends');

        if (rpcError) {
          logger.warn('RPC function failed, trying Edge Function fallback', { error: rpcError, userId: user?.id });

          const { data: edgeData, error: functionError } = await supabase.functions.invoke(
            'analyze-market-trends',
            {
              body: {},
            }
          );

          if (functionError) throw functionError;
          data = edgeData;
        }

        if (!data) throw new Error('No data received');

        setInsights(data);
      } catch (err: any) {
        logger.logError(err, { 
          context: 'MarketInsightsWidget', 
          action: 'fetch',
          userId: user?.id || 'anonymous'
        });
        setError(err.message || 'Impossible de charger les insights du marché');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketInsights();
  }, [user]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Marché immobilier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Marché immobilier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights || (!insights.summary && !insights.monthly_trends && !insights.neighborhood_stats)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Marché immobilier
          </CardTitle>
          <CardDescription>
            {insights?.message || 'Chargement des insights du marché...'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Marché immobilier
        </CardTitle>
        <CardDescription>
          Analyse basée sur vos recherches récentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Section */}
        {insights.summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Vue d'ensemble</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(insights.summary.average_rent / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">Loyer moyen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {insights.summary.properties_count}
                </p>
                <p className="text-xs text-muted-foreground">Biens disponibles</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {insights.summary.popular_neighborhoods?.slice(0, 3).map((neighborhood) => (
                <Badge key={neighborhood} variant="secondary" className="text-xs">
                  {neighborhood}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Neighborhood Stats */}
        {insights.neighborhood_stats && insights.neighborhood_stats.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Quartiers populaires</h3>
            {insights.neighborhood_stats.slice(0, 3).map((neighborhood) => (
              <div key={neighborhood.neighborhood} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{neighborhood.neighborhood}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{(neighborhood.average_rent / 1000).toFixed(0)}k F</p>
                  <p className="text-xs text-muted-foreground">{neighborhood.properties_count} biens</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Recommandations</h3>
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{rec.area}</p>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Mis à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </CardContent>
    </Card>
  );
};
