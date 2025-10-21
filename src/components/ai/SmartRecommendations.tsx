/**
 * COMPOSANT DE RECOMMANDATIONS INTELLIGENTES
 * Affiche les suggestions IA personnalisées avec analyse prédictive
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, TrendingUp, Home, MapPin, DollarSign, Star, Lightbulb,
  Target, Activity, Zap, AlertTriangle, CheckCircle, Info,
  BarChart3, Sparkles, Timer, Shield, Eye, Heart, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIRecommendationsService, { RecommendationScore, UserProfile, PropertyFeatures } from '../../services/aiRecommendationsService';

interface SmartRecommendationsProps {
  userId: string;
  userRole: 'tenant' | 'owner' | 'agency';
  userProfile?: UserProfile;
  maxRecommendations?: number;
  showDetailedAnalysis?: boolean;
  compact?: boolean;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  userId,
  userRole,
  userProfile,
  maxRecommendations = 5,
  showDetailedAnalysis = false,
  compact = false
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);

  const aiService = new AIRecommendationsService();

  useEffect(() => {
    loadRecommendations();
  }, [userId, userProfile]);

  const loadRecommendations = useCallback(async () => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const recs = await aiService.generatePropertyRecommendations(
        userId,
        userProfile,
        maxRecommendations,
        true
      );

      setRecommendations(recs);

      // Charger les insights supplémentaires
      if (showDetailedAnalysis && recs.length > 0) {
        loadAdditionalInsights(recs);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des recommandations');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfile, maxRecommendations, showDetailedAnalysis]);

  const loadAdditionalInsights = async (recs: RecommendationScore[]) => {
    try {
      // Charger les insights du propriétaire si applicable
      if (userRole === 'owner') {
        const ownerInsights = await aiService.generateOwnerInsights(
          userId,
          recs.map(r => r.propertyId)
        );
        setInsights(ownerInsights);
      }
    } catch (err) {
      console.error('Failed to load additional insights:', err);
    }
  };

  const handlePropertyInteraction = async (propertyId: string, interactionType: string) => {
    try {
      await aiService.analyzeUserBehavior(userId, {
        type: interactionType as any,
        propertyId,
        metadata: {
          source: 'ai_recommendations',
          score: recommendations.find(r => r.propertyId === propertyId)?.totalScore
        }
      });

      // Mettre à jour l'interface
      if (interactionType === 'view') {
        setSelectedProperty(propertyId);
      }
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Zap className="w-4 h-4" />;
    if (score >= 75) return <Star className="w-4 h-4" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const formatReason = (reason: any): string => {
    // Formater les raisons en langage naturel
    const explanations: Record<string, string> = {
      'price_match': 'Prix correspondant à votre budget',
      'location_match': 'Localisation idéale selon vos préférences',
      'amenities_match': 'Équipements correspondant à vos critères',
      'behavior_match': 'Similaire à des propriétés que vous avez consultées',
      'market_match': 'Bon rapport qualité-prix sur le marché',
      'quality_match': 'Propriété de haute qualité',
      'availability_match': 'Disponible rapidement',
      'transport_access': 'Excellent accès aux transports',
      'schools_nearby': 'Proximité des écoles',
      'shopping_nearby': 'Commerces à proximité',
      'low_competition': 'Peu de concurrents pour cette propriété',
      'high_demand': 'Zone à forte demande',
      'good_investment': 'Bon potentiel d\'investissement'
    };

    return explanations[reason.factor] || reason.explanation || reason.factor;
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Recommandations IA</h3>
          </div>
          <span className="text-sm text-gray-600">
            {recommendations.length} suggestions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.slice(0, 2).map((rec) => (
            <motion.div
              key={rec.propertyId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(rec.totalScore)}`}>
                  {rec.totalScore}% match
                </span>
              </div>
              <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                Propriété #{rec.propertyId.slice(0, 8)}
              </h4>
              <p className="text-xs text-gray-600">
                {rec.reasons.slice(0, 1).map(formatReason).join(', ')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recommandations Intelligentes</h2>
            <p className="text-sm text-gray-600">
              Des suggestions personnalisées basées sur l'analyse de votre comportement et les tendances du marché
            </p>
          </div>
        </div>

        <button
          onClick={loadRecommendations}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Analyse...' : 'Actualiser'}
        </button>
      </div>

      {/* Messages d'état */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="text-blue-800">
                L'IA analyse des milliers de propriétés pour trouver les meilleures correspondances...
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights globaux */}
      {insights && userRole === 'owner' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Vos Performance Insights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {insights.marketPosition.averageViews}
              </div>
              <div className="text-sm text-gray-600">Vues moyennes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {insights.marketPosition.averageTimeToRent}j
              </div>
              <div className="text-sm text-gray-600">Temps moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {insights.marketPosition.benchmarkComparison === 'above' ? 'Au-dessus' :
                 insights.marketPosition.benchmarkComparison === 'average' ? 'Moyen' : 'En dessous'}
              </div>
              <div className="text-sm text-gray-600">vs Marché</div>
            </div>
          </div>

          {/* Recommandations prioritaires */}
          {insights.recommendations?.slice(0, 2).map((rec: any, i: number) => (
            <div key={i} className="mt-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">{rec.action}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{rec.expectedImpact}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Liste des recommandations */}
      <div className="space-y-4">
        {recommendations.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune recommandation disponible
            </h3>
            <p className="text-gray-500">
              Complétez votre profil pour recevoir des suggestions personnalisées
            </p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.propertyId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                selectedProperty === recommendation.propertyId
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {/* En-tête de la recommandation */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Propriété #{recommendation.propertyId.slice(0, 8)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getScoreColor(recommendation.totalScore)}`}>
                        {getScoreIcon(recommendation.totalScore)}
                        {recommendation.totalScore}% de compatibilité
                      </span>
                      {recommendation.confidence >= 0.8 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Haute confiance IA
                        </span>
                      )}
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Prix</div>
                        <div className="font-semibold text-sm">
                          {Math.round(recommendation.breakdown.priceMatch)}%
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Localisation</div>
                        <div className="font-semibold text-sm">
                          {Math.round(recommendation.breakdown.locationMatch)}%
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Équipements</div>
                        <div className="font-semibold text-sm">
                          {Math.round(recommendation.breakdown.amenitiesMatch)}%
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Comportement</div>
                        <div className="font-semibold text-sm">
                          {Math.round(recommendation.breakdown.behaviorMatch)}%
                        </div>
                      </div>
                    </div>

                    {/* Raisons principales */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Pourquoi cette propriété vous correspond :
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recommendation.reasons.slice(0, 4).map((reason, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span>{formatReason(reason)}</span>
                            {reason.score >= 8 && (
                              <Sparkles className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePropertyInteraction(recommendation.propertyId, 'view')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir les détails
                    </button>
                    <button
                      onClick={() => handlePropertyInteraction(recommendation.propertyId, 'favorite')}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePropertyInteraction(recommendation.propertyId, 'contact')}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                  {showDetailedAnalysis && (
                    <button
                      onClick={() => setExpandedAnalysis(
                        expandedAnalysis === recommendation.propertyId ? null : recommendation.propertyId
                      )}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analyse détaillée
                    </button>
                  )}
                </div>

                {/* Analyse détaillée étendue */}
                <AnimatePresence>
                  {expandedAnalysis === recommendation.propertyId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Analyse détaillée des scores */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Analyse détaillée des scores</h4>
                          <div className="space-y-3">
                            {Object.entries(recommendation.breakdown).map(([key, value]) => {
                              const labels: Record<string, string> = {
                                priceMatch: 'Correspondance du prix',
                                locationMatch: 'Correspondance de la localisation',
                                amenitiesMatch: 'Correspondance des équipements',
                                behaviorMatch: 'Analyse comportementale',
                                marketMatch: 'Position sur le marché',
                                qualityMatch: 'Qualité perçue',
                                availabilityMatch: 'Disponibilité'
                              };

                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{labels[key]}</span>
                                    <span className="font-medium">{Math.round(value)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Facteurs de confiance */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Facteurs de confiance</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                              <Shield className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Niveau de confiance de l'IA
                                </div>
                                <div className="text-xs text-gray-600">
                                  Basé sur {Math.round(recommendation.confidence * 100)}% de certitude
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <Timer className="w-5 h-5 text-green-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Analyse en temps réel
                                </div>
                                <div className="text-xs text-gray-600">
                                  Mis à jour {new Date(recommendation.timestamp).toLocaleTimeString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer avec explications */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Comment fonctionne l'IA :</strong> Notre système analyse votre comportement de navigation,
              vos préférences déclarées, les tendances du marché actuel et des milliers d'autres facteurs
              pour vous recommander les propriétés les plus susceptibles de vous correspondre.
            </p>
            <p>
              Plus vous interagissez avec la plateforme, plus les recommandations deviennent précises.
              Les scores sont mis à jour en temps réel en fonction des nouvelles informations disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;