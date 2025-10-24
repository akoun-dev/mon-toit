import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/services/logger';

export interface Notification {
  id: string;
  user_id: string;
  type: 'application' | 'lease' | 'message' | 'mandate' | 'system' | 'maintenance' | 'payment' | 'review';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

/**
 * Hook pour gérer les notifications de l'utilisateur
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Récupérer les notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      logger.error('Failed to fetch notifications', { error, userId: user.id });
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId: user.id });
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const filtered = prev.filter(n => n.id !== notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return filtered;
      });
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId });
    }
  };

  // Créer une notification (utilisé par d'autres hooks)
  const createNotification = async (
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
    actionUrl?: string,
    priority: Notification['priority'] = 'normal'
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          data,
          action_url: actionUrl,
          priority,
        });

      if (error) throw error;

      // Recharger les notifications
      fetchNotifications();
    } catch (error) {
      logger.error('Failed to create notification', { error, type, title });
    }
  };

  // S'abonner aux nouvelles notifications en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Afficher une notification navigateur si la permission est accordée
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Charger les notifications au montage
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Demander la permission pour les notifications navigateur
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Nettoyer les notifications expirées
  useEffect(() => {
    const cleanupExpired = async () => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .lt('expires_at', new Date().toISOString());

        if (error) throw error;
      } catch (error) {
        logger.error('Failed to cleanup expired notifications', { error });
      }
    };

    // Nettoyer toutes les heures
    const interval = setInterval(cleanupExpired, 60 * 60 * 1000);
    cleanupExpired(); // Exécuter immédiatement

    return () => clearInterval(interval);
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications: fetchNotifications,
    requestNotificationPermission,
  };
};