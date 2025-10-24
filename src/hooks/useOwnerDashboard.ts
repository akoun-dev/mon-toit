import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/services/logger';

export interface OwnerDashboardStats {
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

export interface PropertyAnalytics {
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

/**
 * Hook pour gérer les données du dashboard propriétaire
 */
export const useOwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [propertyAnalytics, setPropertyAnalytics] = useState<PropertyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques du dashboard
  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Appeler la fonction RPC pour les statistiques complètes
      const { data, error } = await supabase
        .rpc('get_owner_dashboard_stats', { owner_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const dashboardStats = data[0];
        setStats(dashboardStats);
      }

      logger.info('Dashboard stats loaded', { userId: user.id });
    } catch (err: any) {
      logger.error('Failed to fetch dashboard stats', { error: err.message, userId: user.id });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger les analytics détaillés des propriétés
  const fetchPropertyAnalytics = async (period: string = '30') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_owner_analytics', {
          owner_user_id: user.id,
          period_range: period
        });

      if (error) throw error;

      setPropertyAnalytics(data || []);
    } catch (err: any) {
      logger.error('Failed to fetch property analytics', { error: err.message, userId: user.id });
      setError(err.message);
    }
  };

  // Charger toutes les données du dashboard
  const loadDashboardData = async (period: string = '30') => {
    await Promise.all([
      fetchDashboardStats(),
      fetchPropertyAnalytics(period)
    ]);
  };

  // Rafraîchir les données
  const refreshData = (period?: string) => {
    loadDashboardData(period);
  };

  // Obtenir les actions urgentes
  const getUrgentActions = () => {
    if (!stats?.urgent_actions) return [];

    try {
      return Array.isArray(stats.urgent_actions) ? stats.urgent_actions : [];
    } catch {
      return [];
    }
  };

  // Obtenir les tendances mensuelles
  const getMonthlyTrends = () => {
    if (!stats?.monthly_trends) return null;

    try {
      return typeof stats.monthly_trends === 'object' ? stats.monthly_trends : null;
    } catch {
      return null;
    }
  };

  // Obtenir les propriétés les plus performantes
  const getTopPerformingProperties = () => {
    if (!stats?.top_performing_properties) return [];

    try {
      return Array.isArray(stats.top_performing_properties) ? stats.top_performing_properties : [];
    } catch {
      return [];
    }
  };

  // Calculer le taux de conversion moyen
  const getAverageConversionRate = () => {
    if (propertyAnalytics.length === 0) return 0;

    const totalConversion = propertyAnalytics.reduce((sum, prop) => sum + prop.conversion_rate, 0);
    return Math.round(totalConversion / propertyAnalytics.length * 100) / 100;
  };

  // Obtenir les propriétés qui nécessitent une attention
  const getPropertiesNeedingAttention = () => {
    return propertyAnalytics.filter(property =>
      property.status === 'maintenance' ||
      property.applications_pending > 5 ||
      property.views_30d < 10 && property.status === 'disponible'
    );
  };

  // Obtenir les statistiques de performance
  const getPerformanceMetrics = () => {
    if (!stats) return null;

    return {
      occupancyRate: stats.occupied_percentage,
      averageRent: stats.average_monthly_rent,
      totalRevenue: stats.total_revenue,
      responseTime: stats.average_response_time_hours,
      applicationRate: stats.total_applications > 0 && stats.total_views > 0
        ? Math.round((stats.total_applications / stats.total_views) * 100)
        : 0
    };
  };

  // Effet pour charger les données au montage
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Effet pour rafraîchir les données périodiquement (toutes les 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return {
    stats,
    propertyAnalytics,
    loading,
    error,
    refreshData,
    getUrgentActions,
    getMonthlyTrends,
    getTopPerformingProperties,
    getAverageConversionRate,
    getPropertiesNeedingAttention,
    getPerformanceMetrics,
  };
};