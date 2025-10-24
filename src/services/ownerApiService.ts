import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

export interface PropertyViewInput {
  property_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  referrer?: string;
}

export interface NotificationInput {
  user_id: string;
  type: 'application' | 'lease' | 'message' | 'mandate' | 'system' | 'maintenance' | 'payment' | 'review';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
}

export interface MaintenanceRequestInput {
  property_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'cleaning' | 'other';
  estimated_cost?: number;
  images?: string[];
  documents?: string[];
  scheduled_date?: string;
  owner_notes?: string;
  tenant_notes?: string;
}

export interface ReportInput {
  owner_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  report_data: any;
  file_url?: string;
  file_size?: number;
}

export interface UserVerificationInput {
  user_id: string;
  verification_type: 'oneci' | 'cnam' | 'face' | 'address' | 'income' | 'phone' | 'email';
  verification_data?: any;
  documents?: string[];
}

/**
 * Service API pour les fonctionnalités propriétaire avancées
 */
export const ownerApiService = {
  // === Gestion des vues de propriétés ===

  /**
   * Enregistrer une vue de propriété
   */
  async trackPropertyView(input: PropertyViewInput) {
    try {
      const { data, error } = await supabase
        .from('property_views')
        .insert({
          ...input,
          viewed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Ignorer les doublons (contrainte unique)
        if (error.code === '23505') {
          return null;
        }
        throw error;
      }

      // Incrémenter le compteur de vues
      await supabase.rpc('increment_property_view', {
        property_uuid: input.property_id
      });

      return data;
    } catch (error) {
      logger.error('Failed to track property view', { error, input });
      throw error;
    }
  },

  /**
   * Obtenir les statistiques de vues pour une propriété
   */
  async getPropertyViewStats(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_views')
        .select('viewed_at, user_id')
        .eq('property_id', propertyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        totalViews: data?.length || 0,
        uniqueViews: new Set(data?.map(v => v.user_id)).size,
        todayViews: data?.filter(v => new Date(v.viewed_at) >= today).length || 0,
        thisWeekViews: data?.filter(v => new Date(v.viewed_at) >= weekAgo).length || 0,
        thisMonthViews: data?.filter(v => new Date(v.viewed_at) >= monthAgo).length || 0,
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get property view stats', { error, propertyId });
      throw error;
    }
  },

  // === Gestion des notifications ===

  /**
   * Créer une notification
   */
  async createNotification(input: NotificationInput) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...input,
          is_read: false,
          created_at: new Date().toISOString(),
          priority: input.priority || 'normal',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create notification', { error, input });
      throw error;
    }
  },

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      throw error;
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllNotificationsAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw error;
    }
  },

  // === Gestion des demandes de maintenance ===

  /**
   * Créer une demande de maintenance
   */
  async createMaintenanceRequest(input: MaintenanceRequestInput & { owner_id: string; tenant_id?: string }) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...input,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!tenant_id(full_name, phone)
        `)
        .single();

      if (error) throw error;

      // Notifier le propriétaire si la demande vient d'un locataire
      if (input.tenant_id && input.tenant_id !== input.owner_id) {
        await this.createNotification({
          user_id: input.owner_id,
          type: 'maintenance',
          title: 'Nouvelle demande de maintenance',
          message: `Une nouvelle demande de maintenance a été soumise pour ${data.property?.title}`,
          data: { maintenance_request_id: data.id },
          action_url: `/maintenance/${data.id}`,
          priority: input.priority === 'urgent' ? 'high' : 'normal',
        });
      }

      return data;
    } catch (error) {
      logger.error('Failed to create maintenance request', { error, input });
      throw error;
    }
  },

  /**
   * Mettre à jour une demande de maintenance
   */
  async updateMaintenanceRequest(
    requestId: string,
    updates: Partial<MaintenanceRequestInput>,
    userId: string
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!tenant_id(full_name, phone),
          owner:profiles!owner_id(full_name, phone)
        `)
        .single();

      if (error) throw error;

      // Notifier les parties concernées selon le changement de statut
      if (updates.status && updates.status !== 'pending') {
        const recipients = [];

        // Notifier le locataire si le propriétaire a mis à jour
        if (data.tenant_id && data.tenant_id !== userId) {
          recipients.push({
            user_id: data.tenant_id,
            title: `Demande de maintenance ${updates.status}`,
            message: `Votre demande de maintenance pour ${data.property?.title} est maintenant ${updates.status}`,
            data: { maintenance_request_id: requestId },
            action_url: `/maintenance/${requestId}`,
          });
        }

        // Notifier le propriétaire si le locataire a mis à jour
        if (data.owner_id !== userId) {
          recipients.push({
            user_id: data.owner_id,
            title: `Demande de maintenance ${updates.status}`,
            message: `La demande de maintenance pour ${data.property?.title} est maintenant ${updates.status}`,
            data: { maintenance_request_id: requestId },
            action_url: `/maintenance/${requestId}`,
          });
        }

        // Envoyer les notifications
        for (const notification of recipients) {
          await this.createNotification(notification);
        }
      }

      return data;
    } catch (error) {
      logger.error('Failed to update maintenance request', { error, requestId, updates });
      throw error;
    }
  },

  /**
   * Obtenir les demandes de maintenance pour un utilisateur
   */
  async getMaintenanceRequests(userId: string, userRole: string) {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(title, address, city, neighborhood),
          tenant:profiles!tenant_id(full_name, phone, avatar_url),
          assigned_user:profiles!assigned_to(full_name, user_type)
        `)
        .order('created_at', { ascending: false });

      // Filtrer selon le rôle de l'utilisateur
      if (userRole === 'proprietaire') {
        query = query.eq('owner_id', userId);
      } else if (userRole === 'locataire') {
        query = query.eq('tenant_id', userId);
      } else {
        // Pour les autres rôles (artisans, etc.)
        query = query.or(`owner_id.eq.${userId},tenant_id.eq.${userId},assigned_to.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get maintenance requests', { error, userId, userRole });
      throw error;
    }
  },

  // === Gestion des rapports ===

  /**
   * Créer un rapport
   */
  async createReport(input: ReportInput) {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .insert({
          ...input,
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create report', { error, input });
      throw error;
    }
  },

  /**
   * Obtenir l'historique des rapports
   */
  async getReportHistory(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .eq('owner_id', ownerId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get report history', { error, ownerId });
      throw error;
    }
  },

  /**
   * Supprimer un rapport
   */
  async deleteReport(reportId: string, ownerId: string) {
    try {
      const { error } = await supabase
        .from('report_history')
        .delete()
        .eq('id', reportId)
        .eq('owner_id', ownerId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to delete report', { error, reportId, ownerId });
      throw error;
    }
  },

  // === Gestion des vérifications utilisateur ===

  /**
   * Créer une demande de vérification
   */
  async createUserVerification(input: UserVerificationInput) {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .insert({
          ...input,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Notifier l'utilisateur
      await this.createNotification({
        user_id: input.user_id,
        type: 'system',
        title: 'Demande de vérification soumise',
        message: `Votre demande de vérification ${input.verification_type} a été soumise et est en cours de traitement.`,
        data: { verification_id: data.id },
        priority: 'normal',
      });

      return data;
    } catch (error) {
      logger.error('Failed to create user verification', { error, input });
      throw error;
    }
  },

  /**
   * Mettre à jour une vérification (pour les admins)
   */
  async updateUserVerification(
    verificationId: string,
    updates: {
      status: 'approved' | 'rejected' | 'in_progress';
      verification_data?: any;
      rejection_reason?: string;
      verified_by?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .update({
          ...updates,
          verified_at: updates.status === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', verificationId)
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .single();

      if (error) throw error;

      // Notifier l'utilisateur du résultat
      await this.createNotification({
        user_id: data.user_id,
        type: 'system',
        title: `Vérification ${updates.status}`,
        message: updates.status === 'approved'
          ? `Votre vérification ${data.verification_type} a été approuvée avec succès.`
          : `Votre vérification ${data.verification_type} a été ${updates.status}${updates.rejection_reason ? ': ' + updates.rejection_reason : ''}.`,
        data: { verification_id: data.id, status: updates.status },
        priority: updates.status === 'approved' ? 'normal' : 'high',
      });

      return data;
    } catch (error) {
      logger.error('Failed to update user verification', { error, verificationId, updates });
      throw error;
    }
  },

  /**
   * Obtenir les vérifications d'un utilisateur
   */
  async getUserVerifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user verifications', { error, userId });
      throw error;
    }
  },

  // === Utilitaires ===

  /**
   * Nettoyer les anciennes notifications expirées
   */
  async cleanupExpiredNotifications() {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Failed to cleanup expired notifications', { error });
      throw error;
    }
  },

  /**
   * Obtenir les statistiques globales pour le dashboard
   */
  async getOwnerDashboardStats(ownerId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_owner_dashboard_stats', { owner_user_id: ownerId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      logger.error('Failed to get owner dashboard stats', { error, ownerId });
      throw error;
    }
  },

  /**
   * Obtenir les analytics détaillés des propriétés
   */
  async getPropertyAnalytics(ownerId: string, period: string = '30') {
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
};