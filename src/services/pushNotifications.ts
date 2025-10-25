interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');

      // Get existing subscription
      this.subscription = await this.swRegistration.pushManager.getSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(userId: string): Promise<boolean> {
    if (!this.swRegistration) {
      throw new Error('Service worker not initialized');
    }

    try {
      // Unsubscribe existing subscription if any
      if (this.subscription) {
        await this.unsubscribe();
      }

      // Create new subscription
      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription, userId);

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer();
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent
    });

    if (payload.actions) {
      notification.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(payload, notification);
      };
    }

    // Auto-close notification after 5 seconds unless interaction is required
    if (!payload.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  async sendPushNotification(subscription: PushSubscription, payload: NotificationPayload): Promise<void> {
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload
        })
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    try {
      const subscriptionData: SubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ?
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
          auth: subscription.getKey('auth') ?
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
        }
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          userId,
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    if (!this.subscription) return;

    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private handleNotificationClick(payload: NotificationPayload, notification: Notification): void {
    // Handle notification click
    if (payload.data?.url) {
      window.open(payload.data.url, '_blank');
    }

    // Handle custom actions
    if (payload.data?.action) {
      switch (payload.data.action) {
        case 'view_property':
          if (payload.data.propertyId) {
            window.location.href = `/property/${payload.data.propertyId}`;
          }
          break;
        case 'view_messages':
          window.location.href = '/messages';
          break;
        case 'view_applications':
          window.location.href = '/applications';
          break;
      }
    }

    notification.close();
  }

  private getVapidPublicKey(): string {
    // This should come from your environment variables
    return process.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility methods
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    permission: NotificationPermission;
    endpoint?: string;
  }> {
    return {
      isSubscribed: this.isSubscribed(),
      permission: this.getPermissionStatus(),
      endpoint: this.subscription?.endpoint
    };
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  newMessage: (senderName: string, propertyTitle: string): NotificationPayload => ({
    title: 'Nouveau message',
    body: `Vous avez reçu un message de ${senderName} concernant ${propertyTitle}`,
    icon: '/icons/message-icon.png',
    tag: 'new-message',
    data: {
      type: 'message',
      url: '/messages'
    }
  }),

  newApplication: (tenantName: string, propertyTitle: string): NotificationPayload => ({
    title: 'Nouvelle candidature',
    body: `${tenantName} a postulé pour votre bien: ${propertyTitle}`,
    icon: '/icons/application-icon.png',
    tag: 'new-application',
    data: {
      type: 'application',
      url: '/applications'
    }
  }),

  visitScheduled: (propertyTitle: string, date: string): NotificationPayload => ({
    title: 'Visite planifiée',
    body: `Une visite est planifiée pour ${propertyTitle} le ${date}`,
    icon: '/icons/visit-icon.png',
    tag: 'visit-scheduled',
    data: {
      type: 'visit',
      url: '/visits'
    }
  }),

  paymentReceived: (amount: number, propertyTitle: string): NotificationPayload => ({
    title: 'Paiement reçu',
    body: `Paiement de ${amount.toLocaleString()} FCFA reçu pour ${propertyTitle}`,
    icon: '/icons/payment-icon.png',
    tag: 'payment-received',
    data: {
      type: 'payment',
      url: '/payments'
    }
  }),

  leaseExpiring: (propertyTitle: string, daysLeft: number): NotificationPayload => ({
    title: 'Bail expirant bientôt',
    body: `Le bail pour ${propertyTitle} expire dans ${daysLeft} jours`,
    icon: '/icons/lease-icon.png',
    tag: 'lease-expiring',
    requireInteraction: true,
    data: {
      type: 'lease',
      url: '/leases'
    }
  }),

  newFavorite: (propertyTitle: string): NotificationPayload => ({
    title: 'Nouveau favori',
    body: `Quelqu'un a ajouté ${propertyTitle} à ses favoris`,
    icon: '/icons/favorite-icon.png',
    tag: 'new-favorite',
    data: {
      type: 'favorite',
      url: '/analytics'
    }
  })
};

// React hook for push notifications
export const usePushNotifications = () => {
  const [service, setService] = useState<PushNotificationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pushService = new PushNotificationService();
    setService(pushService);

    pushService.initialize().then((success) => {
      setIsInitialized(success);
    });
  }, []);

  const subscribe = async (userId: string): Promise<boolean> => {
    if (!service) return false;

    setIsLoading(true);
    try {
      const permission = await service.requestPermission();
      if (permission === 'granted') {
        return await service.subscribe(userId);
      }
      return false;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!service) return false;

    setIsLoading(true);
    try {
      return await service.unsubscribe();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendLocalNotification = async (payload: NotificationPayload): Promise<void> => {
    if (!service) return;
    await service.sendLocalNotification(payload);
  };

  const getStatus = async () => {
    if (!service) return null;
    return await service.getSubscriptionStatus();
  };

  return {
    isSupported: service !== null,
    isInitialized,
    isLoading,
    subscribe,
    unsubscribe,
    sendLocalNotification,
    getStatus
  };
};

export default PushNotificationService;