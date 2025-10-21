/**
 * SERVICE DE GAMIFICATION COMPLET
 * Système de points, badges, niveaux et récompenses pour motiver l'engagement
 */

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  role: 'tenant' | 'owner' | 'agency';
  joinDate: string;
}

interface GameStats {
  userId: string;
  level: number;
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string;
  };
  achievements: Achievement[];
  badges: Badge[];
  leaderboardRank: {
    global: number;
    role: number;
    location: number;
  };
  progress: {
    toNextLevel: number;
    totalForNextLevel: number;
    percentage: number;
  };
  seasonStats: {
    seasonId: string;
    points: number;
    rank: number;
    badges: string[];
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'exploration' | 'social' | 'transaction' | 'quality' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  hidden: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number; // 1-5
  category: string;
  unlockedAt: string;
  isActive: boolean;
  expiresAt?: string;
  bonus?: {
    type: 'points_multiplier' | 'discount' | 'feature' | 'visibility';
    value: number;
    description: string;
  };
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal' | 'special';
  category: string;
  requirements: Array<{
    type: string;
    target: number;
    description: string;
  }>;
  rewards: {
    points: number;
    badgeId?: string;
    experience: number;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  userProgress?: Array<{
    requirementType: string;
    current: number;
    completed: boolean;
  }>;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  participantsCount: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'feature' | 'boost' | 'customization' | 'exclusive';
  cost: number;
  category: string;
  availability: {
    permanent: boolean;
    quantity?: number;
    endDate?: string;
    requirements?: {
      level?: number;
      badges?: string[];
    };
  };
  value: {
    type: string;
    amount: number;
    description: string;
  };
  icon: string;
  popularity: number;
  purchasedCount: number;
}

interface Leaderboard {
  type: 'global' | 'role' | 'location' | 'seasonal';
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  entries: Array<{
    rank: number;
    userId: string;
    name: string;
    avatar?: string;
    role: string;
    points: number;
    level: number;
    badges: number;
    change: 'up' | 'down' | 'same' | 'new';
    changeValue?: number;
  }>;
  userRank?: {
    rank: number;
    points: number;
    percentile: number;
  };
  totalParticipants: number;
  lastUpdated: string;
}

interface GameEvent {
  id: string;
  type: string;
  userId: string;
  data: any;
  timestamp: string;
  pointsEarned?: number;
  achievementsUnlocked?: string[];
  levelUp?: boolean;
  newLevel?: number;
}

class GamificationService {
  private baseUrl: string;
  private eventQueue: GameEvent[] = [];
  private processingEvents = false;

  constructor(baseUrl: string = '/api/gamification') {
    this.baseUrl = baseUrl;
    this.startEventProcessor();
  }

  /**
   * Enregistre un événement de gamification
   */
  async trackEvent(eventType: string, userId: string, data: any = {}): Promise<void> {
    const event: GameEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      userId,
      data,
      timestamp: new Date().toISOString()
    };

    this.eventQueue.push(event);
    this.processEventQueue();
  }

  /**
   * Récupère les statistiques de gamification d'un utilisateur
   */
  async getUserStats(userId: string): Promise<GameStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      throw error;
    }
  }

  /**
   * Récupère les défis disponibles pour un utilisateur
   */
  async getChallenges(userId: string, type?: 'daily' | 'weekly' | 'seasonal' | 'special'): Promise<Challenge[]> {
    try {
      const url = type
        ? `${this.baseUrl}/challenges?userId=${userId}&type=${type}`
        : `${this.baseUrl}/challenges?userId=${userId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      return [];
    }
  }

  /**
   * Récupère les récompenses disponibles
   */
  async getRewards(
    userId: string,
    category?: string,
    filter?: 'available' | 'purchased' | 'featured'
  ): Promise<Reward[]> {
    try {
      const params = new URLSearchParams({ userId });
      if (category) params.append('category', category);
      if (filter) params.append('filter', filter);

      const response = await fetch(`${this.baseUrl}/rewards?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      return [];
    }
  }

  /**
   * Achète une récompense avec des points
   */
  async purchaseReward(userId: string, rewardId: string): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
    newBalance?: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/rewards/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          rewardId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to purchase reward:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'achat'
      };
    }
  }

  /**
   * Récupère le classement (leaderboard)
   */
  async getLeaderboard(
    type: 'global' | 'role' | 'location' | 'seasonal' = 'global',
    period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly',
    userId?: string
  ): Promise<Leaderboard> {
    try {
      const params = new URLSearchParams({ type, period });
      if (userId) params.append('userId', userId);

      const response = await fetch(`${this.baseUrl}/leaderboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      throw error;
    }
  }

  /**
   * Récupère les achievements débloqués par un utilisateur
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.baseUrl}/achievements/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user achievements:', error);
      return [];
    }
  }

  /**
   * Vérifie et débloque les achievements
   */
  async checkAchievements(userId: string, eventType: string, data: any): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.baseUrl}/achievements/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          eventType,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    }
  }

  /**
   * Calcule les points gagnés pour un événement
   */
  private calculatePoints(eventType: string, data: any): number {
    const pointsMap: Record<string, number> = {
      // Événements d'engagement
      'profile_completed': 50,
      'property_viewed': 10,
      'property_favorited': 20,
      'search_performed': 5,
      'message_sent': 15,
      'review_written': 30,

      // Événements de transaction
      'application_submitted': 100,
      'visit_scheduled': 80,
      'payment_made': 150,
      'lease_signed': 200,

      // Événements sociaux
      'referral_completed': 300,
      'friend_joined': 100,
      'review_received': 25,

      // Événements de qualité
      'verified_profile': 100,
      'premium_upgrade': 500,
      'document_uploaded': 20,

      // Événements de exploration
      'new_area_explored': 25,
      'virtual_tour_completed': 40,
      'map_interaction': 8,

      // Événements quotidiens
      'daily_login': 20,
      'daily_streak_maintained': 50,

      // Événements spéciaux
      'early_adopter': 1000,
      'bug_reported': 75,
      'feedback_given': 30
    };

    let basePoints = pointsMap[eventType] || 10;

    // Multiplicateurs
    if (data.isFirstTime) basePoints *= 2; // Premier événement de ce type
    if (data.streakBonus) basePoints *= 1.5; // Bonus de streak
    if (data.quality === 'high') basePoints *= 1.3; // Haute qualité
    if (data.speed === 'fast') basePoints *= 1.2; // Action rapide

    return Math.round(basePoints);
  }

  /**
   * Traite la file d'attente des événements
   */
  private async processEventQueue(): Promise<void> {
    if (this.processingEvents || this.eventQueue.length === 0) {
      return;
    }

    this.processingEvents = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processingEvents = false;
    }
  }

  /**
   * Traite un événement individuel
   */
  private async processEvent(event: GameEvent): Promise<void> {
    try {
      // Calculer les points
      const pointsEarned = this.calculatePoints(event.type, event.data);
      event.pointsEarned = pointsEarned;

      // Vérifier les achievements
      const achievementsUnlocked = await this.checkAchievements(
        event.userId,
        event.type,
        event.data
      );
      event.achievementsUnlocked = achievementsUnlocked.map(a => a.id);

      // Envoyer l'événement au serveur
      await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(event)
      });

      // Mettre à jour l'interface si nécessaire
      this.notifyUIUpdate(event);

    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);
    }
  }

  /**
   * Notifie l'interface des mises à jour
   */
  private notifyUIUpdate(event: GameEvent): void {
    // Émettre un événement pour mettre à jour l'interface
    if (typeof window !== 'undefined' && (window as any).eventBus) {
      (window as any).eventBus.emit('gamification:update', {
        type: event.type,
        pointsEarned: event.pointsEarned,
        achievementsUnlocked: event.achievementsUnlocked,
        levelUp: event.levelUp,
        newLevel: event.newLevel
      });
    }
  }

  /**
   * Démarre le processeur d'événements
   */
  private startEventProcessor(): void {
    setInterval(() => {
      this.processEventQueue();
    }, 1000); // Traiter les événements chaque seconde
  }

  /**
   * Crée des défis quotidiens automatiquement
   */
  async generateDailyChallenges(): Promise<void> {
    const challengeTemplates = [
      {
        name: 'Explorateur du jour',
        description: 'Visitez 5 propriétés différentes',
        requirements: [
          { type: 'property_viewed', target: 5, description: '5 propriétés visitées' }
        ],
        rewards: { points: 100, experience: 50 },
        difficulty: 'easy' as const
      },
      {
        name: 'Social actif',
        description: 'Envoyez 3 messages à des propriétaires',
        requirements: [
          { type: 'message_sent', target: 3, description: '3 messages envoyés' }
        ],
        rewards: { points: 150, experience: 75 },
        difficulty: 'medium' as const
      },
      {
        name: 'Chasseur de trésors',
        description: 'Trouvez 3 propriétés qui correspondent à vos critères',
        requirements: [
          { type: 'property_favorited', target: 3, description: '3 favoris ajoutés' }
        ],
        rewards: { points: 200, experience: 100 },
        difficulty: 'medium' as const
      },
      {
        name: 'Mettez à jour votre profil',
        description: 'Complétez 3 sections de votre profil',
        requirements: [
          { type: 'profile_section_completed', target: 3, description: '3 sections complétées' }
        ],
        rewards: { points: 120, experience: 60 },
        difficulty: 'easy' as const
      }
    ];

    // Générer les défis pour aujourd'hui
    const today = new Date().toISOString().split('T')[0];

    for (const template of challengeTemplates) {
      const challenge: Omit<Challenge, 'id' | 'participantsCount'> = {
        ...template,
        type: 'daily',
        category: 'daily',
        startDate: today,
        endDate: today,
        isActive: true
      };

      try {
        await fetch(`${this.baseUrl}/challenges/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify(challenge)
        });
      } catch (error) {
        console.error('Failed to generate daily challenge:', error);
      }
    }
  }

  /**
   * Calcule le niveau en fonction des points
   */
  static calculateLevel(points: number): number {
    // Formule de niveau: niveau = racine carrée de (points / 100)
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  /**
   * Calcule les points nécessaires pour le prochain niveau
   */
  static getPointsForNextLevel(currentLevel: number): number {
    // Points requis = (niveau^2) * 100
    return Math.pow(currentLevel, 2) * 100;
  }

  /**
   * Calcule la progression vers le prochain niveau
   */
  static calculateProgress(currentPoints: number, currentLevel: number): {
    toNextLevel: number;
    totalForNextLevel: number;
    percentage: number;
  } {
    const pointsForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
    const pointsForNextLevel = Math.pow(currentLevel, 2) * 100;
    const toNextLevel = pointsForNextLevel - currentPoints;
    const totalForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
    const percentage = ((currentPoints - pointsForCurrentLevel) / totalForNextLevel) * 100;

    return {
      toNextLevel,
      totalForNextLevel,
      percentage: Math.round(percentage)
    };
  }

  /**
   * Détermine la rareté d'un achievement
   */
  static getAchievementRarity(points: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (points >= 1000) return 'legendary';
    if (points >= 500) return 'epic';
    if (points >= 200) return 'rare';
    return 'common';
  }

  /**
   * Obtient la couleur associée à la rareté
   */
  static getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '#FFD700'; // Or
      case 'epic': return '#9B59B6';      // Violet
      case 'rare': return '#3498DB';      // Bleu
      case 'common': return '#95A5A6';    // Gris
      default: return '#95A5A6';
    }
  }
}

export default GamificationService;
export type {
  GameStats,
  Achievement,
  Badge,
  Challenge,
  Reward,
  Leaderboard,
  GameEvent
};