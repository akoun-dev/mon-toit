import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  total_users: number;
  verified_users: number;
  total_properties: number;
  available_properties: number;
  active_leases: number;
  pending_certifications: number;
  open_disputes: number;
  unread_alerts: number;
  monthly_revenue: number;
  certification_requests_today: number;
  disputes_opened_today: number;
}

export interface MonthlyTrends {
  month: string;
  new_users: number;
  new_properties: number;
  new_leases: number;
  completed_certifications: number;
  resolved_disputes: number;
  monthly_revenue: number;
}

export interface PropertyMetrics {
  total_properties: number;
  properties_by_status: Record<string, number>;
  properties_by_type: Record<string, number>;
  properties_by_city: Record<string, number>;
  average_price: number;
  average_rent: number;
  properties_with_images: number;
  verified_properties: number;
}

export interface UserMetrics {
  total_users: number;
  users_by_type: Record<string, number>;
  verified_users: number;
  verification_rate: number;
  new_users_this_month: number;
  active_users_this_month: number;
  users_by_city: Record<string, number>;
}

class AdminDashboardService {
  // Obtenir les statistiques principales du dashboard
  async getDashboardStats(adminId?: string): Promise<{ data: DashboardStats | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
        p_admin_id: adminId
      });

      if (error) {
        console.error('Erreur stats dashboard:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception stats dashboard:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les tendances mensuelles
  async getMonthlyTrends(months: number = 6): Promise<{ data: MonthlyTrends[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_monthly_admin_trends', {
        months: months
      });

      if (error) {
        console.error('Erreur tendances mensuelles:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception tendances mensuelles:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les métriques de propriétés
  async getPropertyMetrics(): Promise<{ data: PropertyMetrics | null; error: any }> {
    try {
      // Statistiques globales des propriétés
      const { data: totalData, error: totalError } = await supabase
        .from('properties')
        .select('count(*)', { count: 'exact' });

      // Répartition par statut
      const { data: statusData, error: statusError } = await supabase
        .from('properties')
        .select('status, count(*)')
        .group('status');

      // Répartition par type
      const { data: typeData, error: typeError } = await supabase
        .from('properties')
        .select('type, count(*)')
        .group('type');

      // Répartition par ville
      const { data: cityData, error: cityError } = await supabase
        .from('properties')
        .select('city, count(*)')
        .group('city');

      // Prix moyens
      const { data: priceData, error: priceError } = await supabase
        .from('properties')
        .select('price, monthly_rent')
        .not('price', 'is', null)
        .not('monthly_rent', 'is', null);

      if (totalError || statusError || typeError || cityError || priceError) {
        return { data: null, error: 'Erreur récupération métriques propriétés' };
      }

      // Calculer les métriques
      const totalProperties = totalData?.[0]?.count || 0;
      const properties_by_status = this.groupByField(statusData || [], 'status');
      const properties_by_type = this.groupByField(typeData || [], 'type');
      const properties_by_city = this.groupByField(cityData || [], 'city');

      const validPrices = priceData?.filter(p => p.price) || [];
      const validRents = priceData?.filter(p => p.monthly_rent) || [];

      const average_price = validPrices.length > 0
        ? validPrices.reduce((sum, p) => sum + p.price, 0) / validPrices.length
        : 0;

      const average_rent = validRents.length > 0
        ? validRents.reduce((sum, p) => sum + p.monthly_rent, 0) / validRents.length
        : 0;

      const properties_with_images = await this.getPropertiesWithImagesCount();
      const verified_properties = await this.getVerifiedPropertiesCount();

      return {
        data: {
          total_properties: totalProperties,
          properties_by_status,
          properties_by_type,
          properties_by_city,
          average_price,
          average_rent,
          properties_with_images,
          verified_properties
        },
        error: null
      };
    } catch (err) {
      console.error('Exception métriques propriétés:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les métriques utilisateurs
  async getUserMetrics(): Promise<{ data: UserMetrics | null; error: any }> {
    try {
      // Total utilisateurs
      const { data: totalData, error: totalError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact' });

      // Répartition par type
      const { data: typeData, error: typeError } = await supabase
        .from('profiles')
        .select('user_type, count(*)')
        .group('user_type');

      // Répartition par ville
      const { data: cityData, error: cityError } = await supabase
        .from('profiles')
        .select('city, count(*)')
        .not('city', 'is', null)
        .group('city');

      // Utilisateurs vérifiés
      const { data: verifiedData, error: verifiedError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact' })
        .eq('is_verified', true);

      // Nouveaux utilisateurs ce mois
      const thisMonth = new Date().toISOString().slice(0, 7);
      const { data: newUsersData, error: newUsersError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact' })
        .gte('created_at', thisMonth + '-01');

      if (totalError || typeError || cityError || verifiedError || newUsersError) {
        return { data: null, error: 'Erreur récupération métriques utilisateurs' };
      }

      const totalUsers = totalData?.[0]?.count || 0;
      const verifiedUsers = verifiedData?.[0]?.count || 0;
      const newUsersThisMonth = newUsersData?.[0]?.count || 0;
      const users_by_type = this.groupByField(typeData || [], 'user_type');
      const users_by_city = this.groupByField(cityData || [], 'city');

      return {
        data: {
          total_users: totalUsers,
          users_by_type,
          verified_users: verifiedUsers,
          verification_rate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
          new_users_this_month: newUsersThisMonth,
          active_users_this_month: newUsersThisMonth, // Simplification - à améliorer
          users_by_city
        },
        error: null
      };
    } catch (err) {
      console.error('Exception métriques utilisateurs:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les activités récentes
  async getRecentActivities(limit: number = 10): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select(`
          *,
          admin:profiles(full_name, email, user_type)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur activités récentes:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception activités récentes:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les alertes critiques
  async getCriticalAlerts(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .in('severity', ['critical', 'high'])
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erreur alertes critiques:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception alertes critiques:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les certifications en attente
  async getPendingCertificationsCount(): Promise<{ data: number | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ansut_certifications')
        .select('count(*)', { count: 'exact' })
        .eq('status', 'pending');

      if (error) {
        console.error('Erreur compteur certifications en attente:', error);
        return { data: null, error };
      }

      return { data: data?.[0]?.count || 0, error: null };
    } catch (err) {
      console.error('Exception compteur certifications en attente:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir les litiges ouverts
  async getOpenDisputesCount(): Promise<{ data: number | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('count(*)', { count: 'exact' })
        .in('status', ['open', 'in_progress', 'under_mediation']);

      if (error) {
        console.error('Erreur compteur litiges ouverts:', error);
        return { data: null, error };
      }

      return { data: data?.[0]?.count || 0, error: null };
    } catch (err) {
      console.error('Exception compteur litiges ouverts:', err);
      return { data: null, error: err };
    }
  }

  // Obtenir le revenu mensuel
  async getMonthlyRevenue(): Promise<{ data: number | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('monthly_rent')
        .eq('status', 'active');

      if (error) {
        console.error('Erreur revenu mensuel:', error);
        return { data: null, error };
      }

      const totalRevenue = data?.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0) || 0;
      return { data: totalRevenue, error: null };
    } catch (err) {
      console.error('Exception revenu mensuel:', err);
      return { data: null, error: err };
    }
  }

  // Méthodes utilitaires privées
  private groupByField(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + item.count;
      return acc;
    }, {});
  }

  private async getPropertiesWithImagesCount(): Promise<number> {
    const { data, error } = await supabase
      .from('properties')
      .select('count(*)', { count: 'exact' })
      .not('images', 'eq', '{}')
      .not('images', 'is', null);

    return data?.[0]?.count || 0;
  }

  private async getVerifiedPropertiesCount(): Promise<number> {
    const { data, error } = await supabase
      .from('properties')
      .select('count(*)', { count: 'exact' })
      .eq('is_verified', true);

    return data?.[0]?.count || 0;
  }

  // Logger une activité admin
  async logAdminActivity(
    adminId: string,
    action: string,
    targetType: string,
    targetId?: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        success,
        error_message: errorMessage
      });
    } catch (err) {
      console.error('Erreur log activité admin:', err);
    }
  }

  // Exporter les données du dashboard
  async exportDashboardData(
    period: { start_date: string; end_date: string }
  ): Promise<{ data: any | null; error: any }> {
    try {
      const [statsResult, trendsResult, propertyResult, userResult] = await Promise.all([
        this.getDashboardStats(),
        this.getMonthlyTrends(12),
        this.getPropertyMetrics(),
        this.getUserMetrics()
      ]);

      const exportData = {
        generated_at: new Date().toISOString(),
        period,
        dashboard_stats: statsResult.data,
        monthly_trends: trendsResult.data,
        property_metrics: propertyResult.data,
        user_metrics: userResult.data
      };

      return { data: JSON.stringify(exportData, null, 2), error: null };
    } catch (err) {
      console.error('Exception export dashboard:', err);
      return { data: null, error: err };
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;