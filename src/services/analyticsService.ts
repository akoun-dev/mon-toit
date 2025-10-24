import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

export interface PropertyAnalyticsData {
  property_id: string;
  property_title: string;
  property_image: string;
  monthly_rent: number;
  views_total: number;
  views_7d: number;
  views_30d: number;
  applications_count: number;
  applications_approved: number;
  applications_pending: number;
  favorites_count: number;
  conversion_rate: number;
  average_response_time_hours: number;
  status: string;
  last_view_date: string;
  property_score: number;
}

export interface DashboardStats {
  total_properties: number;
  available_properties: number;
  rented_properties: number;
  total_views: number;
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  total_favorites: number;
  average_response_time_hours: number;
  total_revenue: number;
  occupied_percentage: number;
  average_monthly_rent: number;
  properties_by_status: any;
  monthly_trends: any;
  top_performing_properties: any;
  urgent_actions: any;
}

export interface TrendData {
  period: string;
  value: number;
  change_percentage?: number;
}

export interface PerformanceMetrics {
  occupancy_rate: number;
  average_rent: number;
  total_revenue: number;
  response_time: number;
  application_rate: number;
  tenant_satisfaction?: number;
  maintenance_cost_ratio?: number;
}

/**
 * Service pour les analytics et statistiques propriétaire
 */
export const analyticsService = {
  // === Analytics des propriétés ===

  /**
   * Obtenir les analytics complets pour les propriétés d'un propriétaire
   */
  async getPropertyAnalytics(ownerId: string, period: string = '30'): Promise<PropertyAnalyticsData[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_owner_analytics', {
          owner_user_id: ownerId,
          period_range: period
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get property analytics', { error, ownerId, period });
      throw error;
    }
  },

  /**
   * Obtenir les statistiques du dashboard propriétaire
   */
  async getDashboardStats(ownerId: string): Promise<DashboardStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_owner_dashboard_stats', { owner_user_id: ownerId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error, ownerId });
      throw error;
    }
  },

  /**
   * Obtenir les tendances mensuelles pour une propriété
   */
  async getPropertyTrends(propertyId: string, months: number = 12): Promise<{
    views_trend: TrendData[];
    applications_trend: TrendData[];
    favorites_trend: TrendData[];
  }> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Obtenir les vues mensuelles
      const { data: viewsData, error: viewsError } = await supabase
        .from('property_views')
        .select('viewed_at')
        .eq('property_id', propertyId)
        .gte('viewed_at', startDate.toISOString());

      if (viewsError) throw viewsError;

      // Obtenir les candidatures mensuelles
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('rental_applications')
        .select('created_at')
        .eq('property_id', propertyId)
        .gte('created_at', startDate.toISOString());

      if (applicationsError) throw applicationsError;

      // Obtenir les favoris mensuels
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('created_at')
        .eq('property_id', propertyId)
        .gte('created_at', startDate.toISOString());

      if (favoritesError) throw favoritesError;

      // Agréger les données par mois
      const monthlyViews = this.aggregateByMonth(viewsData || [], 'viewed_at');
      const monthlyApplications = this.aggregateByMonth(applicationsData || [], 'created_at');
      const monthlyFavorites = this.aggregateByMonth(favoritesData || [], 'created_at');

      return {
        views_trend: monthlyViews,
        applications_trend: monthlyApplications,
        favorites_trend: monthlyFavorites,
      };
    } catch (error) {
      logger.error('Failed to get property trends', { error, propertyId, months });
      throw error;
    }
  },

  /**
   * Obtenir les tendances pour toutes les propriétés d'un propriétaire
   */
  async getOwnerTrends(ownerId: string, months: number = 12): Promise<{
    revenue_trend: TrendData[];
    occupancy_trend: TrendData[];
    applications_trend: TrendData[];
    maintenance_trend: TrendData[];
  }> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Obtenir les revenus mensuels (via les baux)
      const { data: leasesData, error: leasesError } = await supabase
        .from('leases')
        .select('monthly_rent, start_date, end_date, status')
        .eq('landlord_id', ownerId);

      if (leasesError) throw leasesError;

      // Obtenir les candidatures mensuelles
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('rental_applications')
        .select('created_at')
        .in('property_id', (
          supabase
            .from('properties')
            .select('id')
            .eq('owner_id', ownerId)
        ))
        .gte('created_at', startDate.toISOString());

      if (applicationsError) throw applicationsError;

      // Obtenir les demandes de maintenance mensuelles
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('created_at, estimated_cost, actual_cost')
        .eq('owner_id', ownerId)
        .gte('created_at', startDate.toISOString());

      if (maintenanceError) throw maintenanceError;

      // Calculer les tendances
      const revenueTrend = this.calculateRevenueTrend(leasesData || [], months);
      const occupancyTrend = this.calculateOccupancyTrend(ownerId, months);
      const applicationsTrend = this.aggregateByMonth(applicationsData || [], 'created_at');
      const maintenanceTrend = this.calculateMaintenanceTrend(maintenanceData || [], months);

      return {
        revenue_trend: revenueTrend,
        occupancy_trend: occupancyTrend,
        applications_trend: applicationsTrend,
        maintenance_trend: maintenanceTrend,
      };
    } catch (error) {
      logger.error('Failed to get owner trends', { error, ownerId, months });
      throw error;
    }
  },

  /**
   * Obtenir les métriques de performance
   */
  async getPerformanceMetrics(ownerId: string): Promise<PerformanceMetrics> {
    try {
      const stats = await this.getDashboardStats(ownerId);
      if (!stats) {
        throw new Error('No stats available');
      }

      return {
        occupancy_rate: stats.occupied_percentage,
        average_rent: stats.average_monthly_rent,
        total_revenue: stats.total_revenue,
        response_time: stats.average_response_time_hours,
        application_rate: stats.total_views > 0
          ? Math.round((stats.total_applications / stats.total_views) * 100)
          : 0,
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', { error, ownerId });
      throw error;
    }
  },

  /**
   * Obtenir les propriétés les plus performantes
   */
  async getTopPerformingProperties(ownerId: string, limit: number = 5): Promise<PropertyAnalyticsData[]> {
    try {
      const analytics = await this.getPropertyAnalytics(ownerId);

      return analytics
        .sort((a, b) => b.property_score - a.property_score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get top performing properties', { error, ownerId });
      throw error;
    }
  },

  /**
   * Obtenir les propriétés qui nécessitent une attention
   */
  async getPropertiesNeedingAttention(ownerId: string): Promise<{
    low_performing: PropertyAnalyticsData[];
    high_applications: PropertyAnalyticsData[];
    maintenance_needed: any[];
  }> {
    try {
      const analytics = await this.getPropertyAnalytics(ownerId);

      const lowPerforming = analytics.filter(p =>
        p.property_score < 50 ||
        (p.views_30d < 5 && p.status === 'disponible')
      );

      const highApplications = analytics.filter(p =>
        p.applications_pending > 5
      );

      // Obtenir les propriétés en maintenance
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(id, title, address)
        `)
        .eq('owner_id', ownerId)
        .in('status', ['pending', 'in_progress']);

      if (maintenanceError) throw maintenanceError;

      return {
        low_performing: lowPerforming,
        high_applications: highApplications,
        maintenance_needed: maintenanceData || [],
      };
    } catch (error) {
      logger.error('Failed to get properties needing attention', { error, ownerId });
      throw error;
    }
  },

  /**
   * Générer un rapport complet
   */
  async generateFullReport(
    ownerId: string,
    reportType: 'monthly' | 'quarterly' | 'annual',
    periodStart: string,
    periodEnd: string
  ) {
    try {
      const [
        dashboardStats,
        propertyAnalytics,
        ownerTrends,
        performanceMetrics,
        topProperties,
        attentionNeeded
      ] = await Promise.all([
        this.getDashboardStats(ownerId),
        this.getPropertyAnalytics(ownerId),
        this.getOwnerTrends(ownerId, reportType === 'monthly' ? 1 : reportType === 'quarterly' ? 3 : 12),
        this.getPerformanceMetrics(ownerId),
        this.getTopPerformingProperties(ownerId),
        this.getPropertiesNeedingAttention(ownerId)
      ]);

      const reportData = {
        overview: dashboardStats,
        property_performance: propertyAnalytics,
        trends: ownerTrends,
        performance_metrics: performanceMetrics,
        top_properties: topProperties,
        attention_needed: attentionNeeded,
        generated_at: new Date().toISOString(),
        report_type: reportType,
        period: { start: periodStart, end: periodEnd }
      };

      return reportData;
    } catch (error) {
      logger.error('Failed to generate full report', { error, ownerId, reportType });
      throw error;
    }
  },

  // === Méthodes utilitaires ===

  /**
   * Agréger des données par mois
   */
  private aggregateByMonth(data: any[], dateField: string): TrendData[] {
    const monthlyData: Record<string, number> = {};

    data.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    // Convertir en tableau trié
    return Object.entries(monthlyData)
      .map(([period, value]) => ({
        period,
        value
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },

  /**
   * Calculer la tendance des revenus
   */
  private calculateRevenueTrend(leases: any[], months: number): TrendData[] {
    const monthlyRevenue: Record<string, number> = {};
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Initialiser tous les mois à 0
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = 0;
    }

    // Calculer les revenus pour chaque mois
    leases.forEach(lease => {
      if (lease.status === 'active') {
        const startDate = new Date(lease.start_date);
        const endDate = new Date(lease.end_date);

        let currentDate = new Date(Math.max(startDate, new Date(startDate)));
        while (currentDate <= endDate && currentDate <= new Date()) {
          const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

          if (monthlyRevenue.hasOwnProperty(monthKey)) {
            monthlyRevenue[monthKey] += lease.monthly_rent;
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
    });

    // Convertir en tableau et calculer les pourcentages de changement
    const trend = Object.entries(monthlyRevenue)
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculer les pourcentages de changement
    for (let i = 1; i < trend.length; i++) {
      const previousValue = trend[i - 1].value;
      const currentValue = trend[i].value;

      if (previousValue > 0) {
        trend[i].change_percentage = Math.round(((currentValue - previousValue) / previousValue) * 100);
      }
    }

    return trend;
  },

  /**
   * Calculer la tendance d'occupation
   */
  private calculateOccupancyTrend(ownerId: string, months: number): TrendData[] {
    // Implémentation simplifiée - à améliorer avec des données réelles
    const trend: TrendData[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Simulation - remplacer avec une vraie requête SQL
      trend.push({
        period: monthKey,
        value: Math.floor(Math.random() * 30) + 70 // Entre 70% et 100%
      });
    }

    return trend;
  },

  /**
   * Calculer la tendance des coûts de maintenance
   */
  private calculateMaintenanceTrend(maintenance: any[], months: number): TrendData[] {
    const monthlyCosts: Record<string, number> = {};
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Initialiser tous les mois à 0
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCosts[monthKey] = 0;
    }

    // Calculer les coûts pour chaque mois
    maintenance.forEach(request => {
      const date = new Date(request.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyCosts.hasOwnProperty(monthKey)) {
        const cost = request.actual_cost || request.estimated_cost || 0;
        monthlyCosts[monthKey] += cost;
      }
    });

    // Convertir en tableau trié
    return Object.entries(monthlyCosts)
      .map(([period, value]) => ({
        period,
        value
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },
};