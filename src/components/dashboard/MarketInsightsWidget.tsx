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

  return (
    <Card className={className}>
      <CardHeader className="p-2 xs:p-3 sm:p-4">
        <CardTitle className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base lg:text-lg">
          <TrendingUp className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
          <span>Marché immobilier</span>
        </CardTitle>
        <CardDescription className="text-xs xs:text-xs sm:text-sm">
          Analyse basée sur vos recherches récentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 xs:space-y-3 sm:space-y-4 p-2 xs:p-3 sm:p-4">
        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Summary Section */}
        {!loading && !error && insights && insights.summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 xs:p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-xs xs:text-sm sm:text-base lg:text-lg mb-1 xs:mb-2 sm:mb-3">Vue d'ensemble</h3>
            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-base xs:text-lg sm:text-2xl font-bold text-blue-600">
                  {(insights.summary.average_rent / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">Loyer moyen</p>
              </div>
              <div className="text-center">
                <p className="text-base xs:text-lg sm:text-2xl font-bold text-purple-600">
                  {insights.summary.properties_count}
                </p>
                <p className="text-xs text-muted-foreground">Biens disponibles</p>
              </div>
            </div>
            <div className="mt-1 xs:mt-2 sm:mt-3 flex flex-wrap gap-1">
              {insights.summary.popular_neighborhoods?.slice(0, 3).map((neighborhood) => (
                <Badge key={neighborhood} variant="secondary" className="text-xs">
                  {neighborhood}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!insights || !insights.summary) && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Données du marché non disponibles pour le moment
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-0.5 xs:pt-1">
          Mis à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </CardContent>
    </Card>
  );
};
