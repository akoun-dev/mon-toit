/**
 * SERVICE DE RECOMMANDATIONS INTELLIGENTES
 * Algorithmes IA pour suggestions personnalisées et analyses prédictives
 */

interface UserProfile {
  id: string;
  role: 'tenant' | 'owner' | 'agency';
  preferences: {
    propertyTypes: string[];
    priceRange: { min: number; max: number };
    locations: Array<{
      city: string;
      district?: string;
      coordinates?: { lat: number; lng: number };
    }>;
    amenities: string[];
    transportModes: string[];
    lifestyleTags: string[];
  };
  behavior: {
    viewHistory: Array<{
      propertyId: string;
      viewDuration: number;
      timestamp: string;
      source: string;
    }>;
    searchQueries: Array<{
      query: string;
      filters: any;
      timestamp: string;
      resultsClicked: string[];
    }>;
    interactions: Array<{
      type: 'favorite' | 'contact' | 'visit_request' | 'application';
      propertyId: string;
      timestamp: string;
    }>;
    responseRate: number;
    averageResponseTime: number;
  };
  demographics: {
    ageGroup?: string;
    familySize?: number;
    incomeBracket?: string;
    employmentStatus?: string;
    pets?: boolean;
    smoking?: boolean;
  };
}

interface PropertyFeatures {
  id: string;
  title: string;
  type: string;
  price: number;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    district: string;
    city: string;
  };
  characteristics: {
    surfaceArea: number;
    bedrooms: number;
    bathrooms: number;
    furnished: boolean;
    floor: number;
    elevator: boolean;
    parking: boolean;
    balcony: boolean;
    garden: boolean;
    pool: boolean;
    securityLevel: number;
  };
  amenities: string[];
  transport: {
    nearestBusStop: number;
    nearestTrainStation: number;
    nearestAirport: number;
    mainRoads: string[];
  };
  marketData: {
    daysOnMarket: number;
    viewsCount: number;
    favoritesCount: number;
    inquiriesCount: number;
    averageRating: number;
    pricePerSquareMeter: number;
    marketDemandScore: number;
  };
  media: {
    photosCount: number;
    videosCount: number;
    virtualTourAvailable: boolean;
    qualityScore: number;
  };
  ownerInfo: {
    responseRate: number;
    averageResponseTime: number;
    verificationLevel: number;
    totalProperties: number;
  };
}

interface RecommendationScore {
  propertyId: string;
  totalScore: number;
  breakdown: {
    priceMatch: number;
    locationMatch: number;
    amenitiesMatch: number;
    behaviorMatch: number;
    marketMatch: number;
    qualityMatch: number;
    availabilityMatch: number;
  };
  reasons: Array<{
    factor: string;
    score: number;
    explanation: string;
  }>;
  confidence: number;
  timestamp: string;
}

interface PriceRecommendation {
  propertyId: string;
  currentPrice: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  marketComparison: {
    similarProperties: number;
    averagePrice: number;
    pricePosition: 'below' | 'average' | 'above';
  };
  factors: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
  timeToRent: number;
  confidence: number;
}

interface MatchingPrediction {
  tenantId: string;
  propertyId: string;
  matchScore: number;
  successProbability: number;
  riskFactors: Array<{
    factor: string;
    risk: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  recommendations: string[];
  estimatedConversionTime: number;
}

class AIRecommendationsService {
  private baseUrl: string;
  private modelCache: Map<string, any> = new Map();

  constructor(baseUrl: string = '/api/ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * Génère des recommandations de propriétés personnalisées
   */
  async generatePropertyRecommendations(
    userId: string,
    userProfile: UserProfile,
    count: number = 10,
    excludeSeen: boolean = true
  ): Promise<RecommendationScore[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          userProfile,
          count,
          excludeSeen,
          includeBehavioralFactors: true,
          includeMarketFactors: true,
          includeQualityFactors: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const recommendations = await response.json();

      // Mettre en cache les résultats
      this.modelCache.set(`recommendations_${userId}`, {
        data: recommendations,
        timestamp: Date.now(),
        ttl: 3600000 // 1 heure
      });

      return recommendations;

    } catch (error) {
      console.error('Failed to generate property recommendations:', error);
      return [];
    }
  }

  /**
   * Analyse le comportement utilisateur et met à jour le profil
   */
  async analyzeUserBehavior(
    userId: string,
    interaction: {
      type: 'view' | 'search' | 'favorite' | 'contact' | 'application';
      propertyId?: string;
      metadata?: any;
    }
  ): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          interaction,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedProfile = await response.json();

      // Invalider le cache des recommandations
      this.modelCache.delete(`recommendations_${userId}`);

      return updatedProfile;

    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
      throw error;
    }
  }

  /**
   * Prédit le matching entre locataire et propriété
   */
  async predictMatching(
    tenantProfile: UserProfile,
    property: PropertyFeatures
  ): Promise<MatchingPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/predict/matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          tenantProfile,
          property,
          includeRiskAnalysis: true,
          includeRecommendations: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to predict matching:', error);
      throw error;
    }
  }

  /**
   * Recommande un prix optimal pour une propriété
   */
  async recommendPrice(
    propertyId: string,
    property: PropertyFeatures,
    marketData?: any
  ): Promise<PriceRecommendation> {
    try {
      const response = await fetch(`${this.baseUrl}/recommend/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          propertyId,
          property,
          marketData,
          includeSeasonalFactors: true,
          includeCompetitorAnalysis: true,
          includeDemandForecast: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to recommend price:', error);
      throw error;
    }
  }

  /**
   * Analyse les tendances du marché immobilier
   */
  async analyzeMarketTrends(
    location: string,
    propertyType?: string,
    timeRange: number = 90 // jours
  ): Promise<{
    priceTrends: Array<{ date: string; averagePrice: number; volume: number }>;
    demandTrends: Array<{ date: string; demandIndex: number; inventory: number }>;
    seasonalPatterns: Array<{ month: number; seasonalFactor: number }>;
    predictions: Array<{
      period: string;
      predictedPrice: number;
      confidence: number;
      factors: string[];
    }>;
    insights: Array<{
      type: 'opportunity' | 'risk' | 'trend';
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze/market-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          location,
          propertyType,
          timeRange,
          includePredictions: true,
          includeSeasonalAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to analyze market trends:', error);
      throw error;
    }
  }

  /**
   * Détecte les opportunités d'investissement
   */
  async detectInvestmentOpportunities(
    criteria: {
      budgetRange: { min: number; max: number };
      locations: string[];
      propertyTypes: string[];
      riskTolerance: 'low' | 'medium' | 'high';
      investmentHorizon: number; // mois
    }
  ): Promise<Array<{
    propertyId: string;
    opportunityScore: number;
    potentialRoi: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: Array<{
      factor: string;
      impact: number;
      explanation: string;
    }>;
    projections: Array<{
      year: number;
      projectedValue: number;
      rentalYield: number;
    }>;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/detect/investment-opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          criteria,
          includeMarketForecast: true,
          includeRiskAssessment: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to detect investment opportunities:', error);
      return [];
    }
  }

  /**
   * Optimise le classement des propriétés dans les résultats de recherche
   */
  async optimizeSearchRanking(
    userId: string,
    properties: PropertyFeatures[],
    searchContext: {
      query: string;
      filters: any;
      userIntent?: 'rental' | 'purchase' | 'investment';
    }
  ): Promise<Array<{
    propertyId: string;
    rankScore: number;
    personalizationScore: number;
    relevanceScore: number;
    qualityScore: number;
  }>> {
    try {
      const cacheKey = `ranking_${userId}_${JSON.stringify(searchContext).slice(0, 100)}`;

      // Vérifier le cache
      const cached = this.modelCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }

      const response = await fetch(`${this.baseUrl}/optimize/search-ranking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          properties,
          searchContext,
          includePersonalization: true,
          includeBehavioralFactors: true,
          includeQualityFactors: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ranking = await response.json();

      // Mettre en cache
      this.modelCache.set(cacheKey, {
        data: ranking,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      });

      return ranking;

    } catch (error) {
      console.error('Failed to optimize search ranking:', error);
      // Retourner un classement par défaut
      return properties.map((prop, index) => ({
        propertyId: prop.id,
        rankScore: properties.length - index,
        personalizationScore: 0.5,
        relevanceScore: 0.5,
        qualityScore: 0.5
      }));
    }
  }

  /**
   * Génère des insights prédictifs pour les propriétaires
   */
  async generateOwnerInsights(
    ownerId: string,
    propertyIds: string[]
  ): Promise<{
    performanceMetrics: Array<{
      propertyId: string;
      currentPerformance: number;
      predictedPerformance: number;
      improvementOpportunities: string[];
    }>;
    marketPosition: {
      averageViews: number;
      averageInquiries: number;
      averageTimeToRent: number;
      benchmarkComparison: 'above' | 'average' | 'below';
    };
    recommendations: Array<{
      type: 'pricing' | 'marketing' | 'presentation' | 'timing';
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
    }>;
    riskAlerts: Array<{
      risk: string;
      probability: number;
      mitigation: string;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/insights/owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ownerId,
          propertyIds,
          includeMarketAnalysis: true,
          includeCompetitorAnalysis: true,
          includePredictiveInsights: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to generate owner insights:', error);
      throw error;
    }
  }

  /**
   * Entraîne les modèles ML avec les nouvelles données
   */
  async updateModels(
    dataUpdate: {
      type: 'user_interactions' | 'market_data' | 'property_features' | 'outcomes';
      data: any[];
    }
  ): Promise<{
    modelVersion: string;
    accuracy: number;
    samplesUsed: number;
    improvements: Array<{
      metric: string;
      before: number;
      after: number;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/models/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(dataUpdate)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Vider le cache après mise à jour des modèles
      this.modelCache.clear();

      return result;

    } catch (error) {
      console.error('Failed to update models:', error);
      throw error;
    }
  }

  /**
   * Évalue la performance des recommandations
   */
  async evaluateRecommendationPerformance(
    userId: string,
    timeRange: number = 30 // jours
  ): Promise<{
    clickThroughRate: number;
    conversionRate: number;
    averageRank: number;
    userSatisfaction: number;
    topPerformingFactors: Array<{
      factor: string;
      importance: number;
    }>;
    improvementAreas: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/evaluate/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId,
          timeRange
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to evaluate recommendation performance:', error);
      throw error;
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * Récupère les statistiques du cache
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.modelCache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      ttl: value.ttl
    }));

    return {
      size: this.modelCache.size,
      entries
    };
  }
}

export default AIRecommendationsService;
export type {
  UserProfile,
  PropertyFeatures,
  RecommendationScore,
  PriceRecommendation,
  MatchingPrediction
};