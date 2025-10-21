/**
 * SERVICE DE NOTIFICATIONS INTELLIGENTES PERSONNALISÉES
 * Gère les notifications contextuelles, prédictives et adaptatives
 */

interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  frequency: {
    immediate: string[];
    hourly: string[];
    daily: string[];
    weekly: string[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  categories: {
    messages: boolean;
    applications: boolean;
    visits: boolean;
    payments: boolean;
    promotions: boolean;
    recommendations: boolean;
    security: boolean;
    system: boolean;
  };
  smartFilters: {
    enabled: boolean;
    importanceThreshold: number; // 1-10
    behavioralAdaptation: boolean;
    locationAware: boolean;
    timeAware: boolean;
  };
}

interface NotificationTemplate {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  category: 'messages' | 'applications' | 'visits' | 'payments' | 'promotions' | 'recommendations' | 'security' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  body: string;
  actions?: Array<{
    label: string;
    url?: string;
    action?: string;
    primary?: boolean;
  }>;
  metadata?: any;
  expiresAt?: string;
  scheduledFor?: string;
}

interface IntelligentNotification {
  id: string;
  userId: string;
  template: NotificationTemplate;
  personalizedContent: {
    title: string;
    body: string;
    actions?: Array<{
      label: string;
      url?: string;
      action?: string;
      primary?: boolean;
    }>;
  };
  delivery: {
    channels: Array<'inApp' | 'email' | 'push' | 'sms'>;
    scheduledAt: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    attempts: number;
  };
  intelligence: {
    score: number; // 1-10
    confidence: number; // 0-1
    factors: Array<{
      factor: string;
      weight: number;
      value: number;
    }>;
    predictedEngagement: number; // 0-1
    optimalTiming: string;
    context: {
      userActivity: 'active' | 'idle' | 'offline';
      location?: string;
      deviceType?: string;
      timeOfDay: string;
      dayOfWeek: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationAnalytics {
  notificationId: string;
  userId: string;
  metrics: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
    clicked: boolean;
    converted: boolean;
    timeToRead?: number;
    timeToClick?: number;
    timeToConvert?: number;
  };
  abTest?: {
    variant: string;
    group: string;
  };
  feedback?: {
    rating?: number;
    helpful?: boolean;
    reason?: string;
  };
}

interface UserBehaviorPattern {
  userId: string;
  patterns: {
    activeHours: Array<{ hour: number; activityScore: number }>;
    preferredChannels: Record<string, number>;
    responseTimes: Record<string, number>;
    engagementByCategory: Record<string, number>;
    locationPatterns: Array<{
      location: string;
      activityScore: number;
      preferredNotifications: string[];
    }>;
  };
  predictions: {
    nextActiveTime: string;
    optimalNotificationWindow: Array<{ start: string; end: string; score: number }>;
    churnRisk: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
  };
  lastAnalyzed: string;
}

class IntelligentNotificationsService {
  private baseUrl: string;
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private notificationQueue: Map<string, IntelligentNotification[]> = new Map();

  constructor(baseUrl: string = '/api/notifications') {
    this.baseUrl = baseUrl;
  }

  /**
   * Crée une notification intelligente avec personnalisation
   */
  async createIntelligentNotification(
    userId: string,
    template: NotificationTemplate,
    context?: any
  ): Promise<IntelligentNotification> {
    try {
      // Récupérer les préférences et patterns utilisateur
      const preferences = await this.getUserPreferences(userId);
      const patterns = await this.getUserBehaviorPatterns(userId);

      // Analyser l'intelligence de la notification
      const intelligence = await this.analyzeNotificationIntelligence(
        userId,
        template,
        preferences,
        patterns,
        context
      );

      // Personnaliser le contenu
      const personalizedContent = await this.personalizeContent(
        template,
        userId,
        intelligence,
        context
      );

      // Déterminer le timing optimal
      const optimalTiming = this.calculateOptimalTiming(
        template,
        preferences,
        intelligence,
        patterns
      );

      // Créer la notification
      const notification: IntelligentNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        template,
        personalizedContent,
        delivery: {
          channels: this.selectOptimalChannels(template, preferences, intelligence),
          scheduledAt: optimalTiming,
          sentAt: undefined,
          deliveredAt: undefined,
          readAt: undefined,
          status: 'pending',
          attempts: 0
        },
        intelligence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Sauvegarder et mettre en file d'attente
      await this.saveNotification(notification);
      this.queueNotification(notification);

      return notification;

    } catch (error) {
      console.error('Failed to create intelligent notification:', error);
      throw error;
    }
  }

  /**
   * Analyse l'intelligence d'une notification
   */
  private async analyzeNotificationIntelligence(
    userId: string,
    template: NotificationTemplate,
    preferences: NotificationPreferences,
    patterns: UserBehaviorPattern,
    context?: any
  ): Promise<IntelligentNotification['intelligence']> {
    const factors: Array<{ factor: string; weight: number; value: number }> = [];

    // Facteur d'importance de base
    factors.push({
      factor: 'base_importance',
      weight: 0.3,
      value: this.getImportanceScore(template.priority)
    });

    // Facteur de préférence de catégorie
    factors.push({
      factor: 'category_preference',
      weight: 0.2,
      value: patterns.patterns.engagementByCategory[template.category] || 0.5
    });

    // Facteur de timing
    const currentHour = new Date().getHours();
    const currentActivity = patterns.patterns.activeHours[currentHour];
    factors.push({
      factor: 'timing_relevance',
      weight: 0.15,
      value: currentActivity?.activityScore || 0.5
    });

    // Facteur de contexte utilisateur
    if (context) {
      factors.push({
        factor: 'context_relevance',
        weight: 0.15,
        value: this.calculateContextRelevance(context, patterns)
      });
    }

    // Facteur de comportement récent
    factors.push({
      factor: 'recent_behavior',
      weight: 0.1,
      value: await this.getRecentBehaviorScore(userId, template.category)
    });

    // Facteur de prédiction d'engagement
    factors.push({
      factor: 'predicted_engagement',
      weight: 0.1,
      value: this.predictEngagement(template, patterns)
    });

    // Calculer le score total
    const score = factors.reduce((total, factor) => total + (factor.weight * factor.value), 0);
    const confidence = Math.min(0.95, 0.5 + (factors.length * 0.05)); // Plus de facteurs = plus de confiance

    // Déterminer le contexte actuel
    const currentContext = await this.getCurrentUserContext(userId);

    return {
      score: Math.round(score * 10) / 10,
      confidence,
      factors,
      predictedEngagement: this.predictEngagement(template, patterns),
      optimalTiming: this.calculateOptimalDeliveryTime(patterns, currentContext),
      context: currentContext
    };
  }

  /**
   * Personnalise le contenu de la notification
   */
  private async personalizeContent(
    template: NotificationTemplate,
    userId: string,
    intelligence: IntelligentNotification['intelligence'],
    context?: any
  ): Promise<IntelligentNotification['personalizedContent']> {
    // Récupérer les données utilisateur pour la personnalisation
    const userData = await this.getUserPersonalizationData(userId);

    // Personnaliser le titre
    let title = template.title;
    let body = template.body;

    // Remplacer les variables de template
    title = this.replaceTemplateVariables(title, userData, context);
    body = this.replaceTemplateVariables(body, userData, context);

    // Adapter le ton en fonction du score d'intelligence
    if (intelligence.score >= 8) {
      // Score élevé - ton plus direct et personnalisé
      title = this.addPersonalization(title, userData, intelligence);
      body = this.addPersonalization(body, userData, intelligence);
    } else if (intelligence.score >= 6) {
      // Score moyen - ton équilibré
      body = this.addContextualRelevance(body, context, intelligence);
    }

    // Personnaliser les actions
    const actions = template.actions?.map(action => ({
      ...action,
      label: this.replaceTemplateVariables(action.label, userData, context),
      url: action.url ? this.replaceTemplateVariables(action.url, userData, context) : action.url
    }));

    return {
      title,
      body,
      actions
    };
  }

  /**
   * Remplace les variables dans les templates
   */
  private replaceTemplateVariables(
    text: string,
    userData: any,
    context?: any
  ): string {
    let result = text;

    // Variables utilisateur
    result = result.replace(/\{\{userName\}\}/g, userData.name || 'Utilisateur');
    result = result.replace(/\{\{userFirstName\}\}/g, userData.firstName || 'Bonjour');
    result = result.replace(/\{\{userCity\}\}/g, userData.city || 'votre ville');

    // Variables contextuelles
    if (context) {
      Object.keys(context).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, context[key]);
      });
    }

    // Variables temporelles
    result = result.replace(/\{\{currentTime\}\}/g,
      new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
    result = result.replace(/\{\{currentDate\}\}/g,
      new Date().toLocaleDateString('fr-FR')
    );

    return result;
  }

  /**
   * Ajoute des éléments de personnalisation
   */
  private addPersonalization(
    text: string,
    userData: any,
    intelligence: IntelligentNotification['intelligence']
  ): string {
    // Ajouter des éléments basés sur le comportement
    if (intelligence.context.userActivity === 'active') {
      text = `🟢 ${text}`;
    }

    // Ajouter des recommandations si pertinent
    if (intelligence.predictedEngagement > 0.8) {
      text += '\n\n💡 Cette notification est particulièrement pertinente pour vous.';
    }

    return text;
  }

  /**
   * Calcule le timing optimal pour la livraison
   */
  private calculateOptimalTiming(
    template: NotificationTemplate,
    preferences: NotificationPreferences,
    intelligence: IntelligentNotification['intelligence'],
    patterns: UserBehaviorPattern
  ): string {
    // Notifications urgentes - immédiat
    if (template.priority === 'urgent' || template.category === 'security') {
      return new Date().toISOString();
    }

    // Vérifier les heures de silence
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const quietStart = parseInt(preferences.quietHours.start.split(':')[0]);
      const quietEnd = parseInt(preferences.quietHours.end.split(':')[0]);

      if (currentHour >= quietStart || currentHour < quietEnd) {
        // Programmer pour après les heures de silence
        const nextActiveTime = new Date(now);
        nextActiveTime.setHours(quietEnd, 0, 0, 0);
        if (nextActiveTime <= now) {
          nextActiveTime.setDate(nextActiveTime.getDate() + 1);
        }
        return nextActiveTime.toISOString();
      }
    }

    // Utiliser les patterns de comportement
    const optimalWindows = patterns.predictions.optimalNotificationWindow;
    if (optimalWindows.length > 0) {
      const bestWindow = optimalWindows.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      const scheduledTime = new Date();
      const [hours, minutes] = bestWindow.start.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Si le temps optimal est dans le passé, programmer pour demain
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      return scheduledTime.toISOString();
    }

    // Par défaut, programmer dans la prochaine heure
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    return defaultTime.toISOString();
  }

  /**
   * Sélectionne les canaux de livraison optimaux
   */
  private selectOptimalChannels(
    template: NotificationTemplate,
    preferences: NotificationPreferences,
    intelligence: IntelligentNotification['intelligence']
  ): Array<'inApp' | 'email' | 'push' | 'sms'> {
    const channels: Array<'inApp' | 'email' | 'push' | 'sms'> = [];

    // Canal in-app toujours disponible
    if (preferences.channels.inApp) {
      channels.push('inApp');
    }

    // Push notifications pour mobile et engagement élevé
    if (preferences.channels.push &&
        intelligence.context.deviceType === 'mobile' &&
        intelligence.predictedEngagement > 0.6) {
      channels.push('push');
    }

    // Email pour les informations détaillées
    if (preferences.channels.email &&
        (template.category === 'applications' || template.category === 'payments')) {
      channels.push('email');
    }

    // SMS pour les urgences et notifications critiques
    if (preferences.channels.sms &&
        (template.priority === 'urgent' || template.category === 'security')) {
      channels.push('sms');
    }

    return channels.length > 0 ? channels : ['inApp'];
  }

  /**
   * Traite la file d'attente des notifications
   */
  async processNotificationQueue(): Promise<void> {
    const now = new Date();

    for (const [userId, notifications] of this.notificationQueue) {
      const readyNotifications = notifications.filter(notif =>
        new Date(notif.delivery.scheduledAt) <= now &&
        notif.delivery.status === 'pending'
      );

      for (const notification of readyNotifications) {
        try {
          await this.deliverNotification(notification);
        } catch (error) {
          console.error(`Failed to deliver notification ${notification.id}:`, error);
          await this.handleDeliveryFailure(notification, error);
        }
      }
    }
  }

  /**
   * Livre une notification via les canaux appropriés
   */
  private async deliverNotification(notification: IntelligentNotification): Promise<void> {
    const deliveryPromises = notification.delivery.channels.map(async (channel) => {
      switch (channel) {
        case 'inApp':
          return this.deliverInAppNotification(notification);
        case 'push':
          return this.deliverPushNotification(notification);
        case 'email':
          return this.deliverEmailNotification(notification);
        case 'sms':
          return this.deliverSMSNotification(notification);
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }
    });

    await Promise.allSettled(deliveryPromises);

    // Mettre à jour le statut
    notification.delivery.status = 'sent';
    notification.delivery.sentAt = new Date().toISOString();
    notification.delivery.attempts += 1;

    await this.updateNotification(notification);
  }

  /**
   * Livre une notification in-app
   */
  private async deliverInAppNotification(notification: IntelligentNotification): Promise<void> {
    // Envoyer via WebSocket ou stocker pour récupération
    const eventData = {
      type: 'notification',
      data: {
        id: notification.id,
        userId: notification.userId,
        title: notification.personalizedContent.title,
        body: notification.personalizedContent.body,
        actions: notification.personalizedContent.actions,
        priority: notification.template.priority,
        category: notification.template.category
      }
    };

    // Émettre l'événement WebSocket
    if (typeof window !== 'undefined' && (window as any).websocket) {
      (window as any).websocket.send(JSON.stringify(eventData));
    }

    // Stocker pour récupération offline
    await this.storeInAppNotification(notification.userId, eventData);
  }

  /**
   * Livre une notification push
   */
  private async deliverPushNotification(notification: IntelligentNotification): Promise<void> {
    const payload = {
      title: notification.personalizedContent.title,
      body: notification.personalizedContent.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: notification.id,
      data: {
        notificationId: notification.id,
        userId: notification.userId,
        actions: notification.personalizedContent.actions
      },
      actions: notification.personalizedContent.actions?.map(action => ({
        action: action.action,
        title: action.label
      }))
    };

    // Envoyer via le service de push notifications
    const response = await fetch(`${this.baseUrl}/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify({
        userId: notification.userId,
        payload
      })
    });

    if (!response.ok) {
      throw new Error(`Push delivery failed: ${response.statusText}`);
    }
  }

  /**
   * Livre une notification email
   */
  private async deliverEmailNotification(notification: IntelligentNotification): Promise<void> {
    const emailData = {
      to: await this.getUserEmail(notification.userId),
      subject: notification.personalizedContent.title,
      template: notification.template.category,
      data: {
        body: notification.personalizedContent.body,
        actions: notification.personalizedContent.actions,
        userId: notification.userId,
        notificationId: notification.id
      }
    };

    const response = await fetch(`${this.baseUrl}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email delivery failed: ${response.statusText}`);
    }
  }

  /**
   * Livre une notification SMS
   */
  private async deliverSMSNotification(notification: IntelligentNotification): Promise<void> {
    const smsData = {
      to: await this.getUserPhone(notification.userId),
      message: `${notification.personalizedContent.title}\n\n${notification.personalizedContent.body}`
    };

    const response = await fetch(`${this.baseUrl}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      throw new Error(`SMS delivery failed: ${response.statusText}`);
    }
  }

  /**
   * Gère les échecs de livraison
   */
  private async handleDeliveryFailure(
    notification: IntelligentNotification,
    error: any
  ): Promise<void> {
    notification.delivery.attempts += 1;

    // Réessayer avec un délai exponentiel
    if (notification.delivery.attempts < 3) {
      const retryDelay = Math.pow(2, notification.delivery.attempts) * 60000; // 2min, 4min, 8min
      const retryTime = new Date(Date.now() + retryDelay);
      notification.delivery.scheduledAt = retryTime.toISOString();
      notification.delivery.status = 'pending';
    } else {
      notification.delivery.status = 'failed';
    }

    await this.updateNotification(notification);
  }

  /**
   * Met à jour les patterns de comportement utilisateur
   */
  async updateUserBehaviorPatterns(
    userId: string,
    interaction: {
      type: 'notification_read' | 'notification_clicked' | 'notification_dismissed' | 'notification_converted';
      notificationId: string;
      timestamp: string;
      context?: any;
    }
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/analytics/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          interaction
        })
      });

      // Invalider le cache des patterns
      this.behaviorPatterns.delete(userId);

    } catch (error) {
      console.error('Failed to update behavior patterns:', error);
    }
  }

  /**
   * Méthodes utilitaires privées
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Implémenter la récupération des préférences utilisateur
    return {
      userId,
      channels: { inApp: true, email: true, push: true, sms: false },
      frequency: { immediate: [], hourly: [], daily: [], weekly: [] },
      quietHours: { enabled: true, start: '22:00', end: '08:00', timezone: 'Africa/Abidjan' },
      categories: {
        messages: true, applications: true, visits: true, payments: true,
        promotions: false, recommendations: true, security: true, system: true
      },
      smartFilters: {
        enabled: true,
        importanceThreshold: 6,
        behavioralAdaptation: true,
        locationAware: true,
        timeAware: true
      }
    };
  }

  private async getUserBehaviorPatterns(userId: string): Promise<UserBehaviorPattern> {
    // Implémenter la récupération des patterns de comportement
    return {
      userId,
      patterns: {
        activeHours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activityScore: Math.random()
        })),
        preferredChannels: { inApp: 0.8, push: 0.6, email: 0.4, sms: 0.1 },
        responseTimes: { immediate: 0.9, hourly: 0.7, daily: 0.5 },
        engagementByCategory: { messages: 0.9, applications: 0.8, recommendations: 0.7 },
        locationPatterns: []
      },
      predictions: {
        nextActiveTime: new Date(Date.now() + 3600000).toISOString(),
        optimalNotificationWindow: [{ start: '09:00', end: '10:00', score: 0.9 }],
        churnRisk: 0.1,
        engagementTrend: 'increasing'
      },
      lastAnalyzed: new Date().toISOString()
    };
  }

  private getImportanceScore(priority: string): number {
    switch (priority) {
      case 'urgent': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.4;
      default: return 0.5;
    }
  }

  private calculateContextRelevance(context: any, patterns: UserBehaviorPattern): number {
    // Implémenter le calcul de pertinence contextuelle
    return 0.7; // Placeholder
  }

  private async getRecentBehaviorScore(userId: string, category: string): Promise<number> {
    // Implémenter l'analyse du comportement récent
    return 0.6; // Placeholder
  }

  private predictEngagement(template: NotificationTemplate, patterns: UserBehaviorPattern): number {
    // Implémenter la prédiction d'engagement
    return patterns.patterns.engagementByCategory[template.category] || 0.5;
  }

  private calculateOptimalDeliveryTime(patterns: UserBehaviorPattern, context: any): string {
    // Implémenter le calcul du timing optimal
    return new Date(Date.now() + 3600000).toISOString();
  }

  private async getCurrentUserContext(userId: string): Promise<IntelligentNotification['intelligence']['context']> {
    // Implémenter la récupération du contexte utilisateur
    return {
      userActivity: 'active',
      timeOfDay: new Date().getHours().toString(),
      dayOfWeek: new Date().toLocaleDateString('fr-FR', { weekday: 'long' })
    };
  }

  private async getUserPersonalizationData(userId: string): Promise<any> {
    // Implémenter la récupération des données de personnalisation
    return {
      name: 'Utilisateur',
      firstName: 'Bonjour',
      city: 'Abidjan'
    };
  }

  private addContextualRelevance(text: string, context: any, intelligence: any): string {
    // Implémenter l'ajout de pertinence contextuelle
    return text;
  }

  private async saveNotification(notification: IntelligentNotification): Promise<void> {
    // Implémenter la sauvegarde de la notification
  }

  private queueNotification(notification: IntelligentNotification): void {
    const userId = notification.userId;
    if (!this.notificationQueue.has(userId)) {
      this.notificationQueue.set(userId, []);
    }
    this.notificationQueue.get(userId)!.push(notification);
  }

  private async storeInAppNotification(userId: string, eventData: any): Promise<void> {
    // Implémenter le stockage pour notification in-app
  }

  private async getUserEmail(userId: string): Promise<string> {
    // Implémenter la récupération de l'email utilisateur
    return 'user@example.com';
  }

  private async getUserPhone(userId: string): Promise<string> {
    // Implémenter la récupération du téléphone utilisateur
    return '+22500000000';
  }

  private async updateNotification(notification: IntelligentNotification): Promise<void> {
    // Implémenter la mise à jour de la notification
  }
}

export default IntelligentNotificationsService;
export type {
  NotificationPreferences,
  NotificationTemplate,
  IntelligentNotification,
  NotificationAnalytics,
  UserBehaviorPattern
};