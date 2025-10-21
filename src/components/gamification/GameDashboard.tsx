/**
 * TABLEAU DE BORD DE GAMIFICATION
 * Affiche les points, niveaux, achievements et défis interactifs
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy, Star, Zap, Target, Award, TrendingUp, Calendar,
  Gift, Crown, Shield, Sword, Gem, Coins, Medal, Flag,
  Clock, Users, MapPin, Briefcase, Sparkles, Flame,
  CheckCircle, Lock, BarChart3, Activity, Heart, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GamificationService, { GameStats, Challenge, Reward, Achievement } from '../../services/gamificationService';

interface GameDashboardProps {
  userId: string;
  userRole: 'tenant' | 'owner' | 'agency';
  compact?: boolean;
  showLeaderboard?: boolean;
}

const GameDashboard: React.FC<GameDashboardProps> = ({
  userId,
  userRole,
  compact = false,
  showLeaderboard = true
}) => {
  const [userStats, setUserStats] = useState<GameStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'challenges' | 'rewards' | 'achievements'>('overview');
  const [showRewardModal, setShowRewardModal] = useState<Reward | null>(null);

  const gameService = new GamificationService();

  useEffect(() => {
    loadGameData();
  }, [userId]);

  const loadGameData = async () => {
    try {
      setIsLoading(true);

      // Charger les statistiques utilisateur
      const stats = await gameService.getUserStats(userId);
      setUserStats(stats);

      // Charger les défis
      const userChallenges = await gameService.getChallenges(userId);
      setChallenges(userChallenges);

      // Charger les récompenses disponibles
      const userRewards = await gameService.getRewards(userId, undefined, 'available');
      setRewards(userRewards.slice(0, 6)); // Limiter pour la vue compacte

      // Charger les achievements récents
      const userAchievements = await gameService.getUserAchievements(userId);
      setAchievements(userAchievements.slice(0, 8)); // Limiter pour la vue compacte

      // Charger le classement si demandé
      if (showLeaderboard) {
        const leaderboardData = await gameService.getLeaderboard('role', 'weekly', userId);
        setLeaderboard(leaderboardData);
      }

    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseReward = async (reward: Reward) => {
    if (!userStats || userStats.availablePoints < reward.cost) {
      return;
    }

    try {
      const result = await gameService.purchaseReward(userId, reward.id);

      if (result.success) {
        // Mettre à jour les statistiques
        await loadGameData();
        setShowRewardModal(null);

        // Afficher une notification de succès
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            type: 'success',
            title: 'Achat réussi !',
            message: `${reward.name} a été ajouté à votre compte.`
          });
        }
      } else {
        // Afficher une notification d'erreur
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification({
            type: 'error',
            title: 'Échec de l\'achat',
            message: result.message
          });
        }
      }
    } catch (error) {
      console.error('Failed to purchase reward:', error);
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (level >= 30) return <Gem className="w-6 h-6 text-purple-500" />;
    if (level >= 20) return <Award className="w-6 h-6 text-blue-500" />;
    if (level >= 10) return <Medal className="w-6 h-6 text-green-500" />;
    return <Star className="w-6 h-6 text-gray-500" />;
  };

  const getChallengeIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      exploration: <MapPin className="w-5 h-5" />,
      social: <Users className="w-5 h-5" />,
      engagement: <Heart className="w-5 h-5" />,
      transaction: <Briefcase className="w-5 h-5" />,
      quality: <Shield className="w-5 h-5" />
    };
    return icons[category] || <Target className="w-5 h-5" />;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'common': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Niveau {userStats?.level || 1}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-900">
              {userStats?.availablePoints || 0}
            </span>
          </div>
        </div>

        {/* Progression */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progression</span>
            <span>{userStats?.progress?.percentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${userStats?.progress?.percentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Défi quotidien */}
        {challenges.slice(0, 1).map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {getChallengeIcon(challenge.category)}
              <span className="text-xs font-medium text-gray-900 truncate">
                {challenge.name}
              </span>
            </div>
            <div className="space-y-1">
              {challenge.requirements.slice(0, 1).map((req, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">{req.description}</span>
                  <span className="font-medium">
                    {challenge.userProgress?.[0]?.current || 0}/{req.target}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                +{challenge.rewards.points} pts
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(100, ((challenge.userProgress?.[0]?.current || 0) / challenge.requirements[0].target) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques principales */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Centre de Gamification</h2>
            <p className="text-purple-100">
              Gagnez des points, débloquez des achievements et atteignez de nouveaux niveaux !
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {userStats && getLevelIcon(userStats.level)}
              <span className="text-3xl font-bold">Niveau {userStats?.level || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="text-xl font-semibold">{userStats?.availablePoints || 0} points</span>
            </div>
          </div>
        </div>

        {/* Barres de progression */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progression vers Niv. {userStats ? userStats.level + 1 : 2}</span>
              <span>{userStats?.progress?.percentage || 0}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${userStats?.progress?.percentage || 0}%` }}
              ></div>
            </div>
            <div className="text-xs text-purple-100 mt-1">
              {userStats?.progress?.toNextLevel || 0} points restants
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="text-lg font-semibold">Streak: {userStats?.streak?.current || 0}</span>
            </div>
            <div className="text-xs text-purple-100">
              Meilleur: {userStats?.streak?.longest || 0} jours
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-lg font-semibold">Rank: #{leaderboard?.userRank?.rank || '-'}</span>
            </div>
            <div className="text-xs text-purple-100">
              Top {leaderboard?.userRank?.percentile || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Aperçu', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'challenges', label: 'Défis', icon: <Target className="w-4 h-4" /> },
          { id: 'rewards', label: 'Récompenses', icon: <Gift className="w-4 h-4" /> },
          { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              selectedTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        {selectedTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Défi quotidien en vedette */}
            {challenges.filter(c => c.type === 'daily').slice(0, 1).map((challenge) => (
              <div key={challenge.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 text-white rounded-lg">
                      {getChallengeIcon(challenge.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
                      <p className="text-sm text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      +{challenge.rewards.points}
                    </div>
                    <div className="text-xs text-gray-600">points</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {challenge.requirements.map((req, i) => {
                    const progress = challenge.userProgress?.find(p => p.requirementType === req.type);
                    const isCompleted = progress?.completed || false;
                    const percentage = Math.min(100, ((progress?.current || 0) / req.target) * 100);

                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {req.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {progress?.current || 0}/{req.target}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Activité</h4>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {userStats?.totalPoints || 0}
                </div>
                <div className="text-sm text-gray-600">Points totaux</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Achievements</h4>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {achievements.length}
                </div>
                <div className="text-sm text-gray-600">Débloqués</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Récompenses</h4>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {rewards.length}
                </div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
            </div>

            {/* Achievements récents */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Achievements récents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.slice(0, 4).map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-4 rounded-lg text-white text-center cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
                    <div className="text-xs opacity-90">+{achievement.points} pts</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {selectedTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-gray-900">Défis disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => {
                const isCompleted = challenge.userProgress?.every(p => p.completed);
                const totalProgress = challenge.userProgress?.reduce((sum, p) => sum + p.current, 0) || 0;
                const totalRequired = challenge.requirements.reduce((sum, req) => sum + req.target, 0);
                const percentage = Math.min(100, (totalProgress / totalRequired) * 100);

                return (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-white rounded-lg p-5 border-2 ${
                      isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getChallengeIcon(challenge.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{challenge.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              challenge.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {challenge.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {challenge.type === 'daily' ? 'Quotidien' :
                               challenge.type === 'weekly' ? 'Hebdomadaire' :
                               challenge.type === 'seasonal' ? 'Saisonnier' : 'Spécial'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          +{challenge.rewards.points}
                        </div>
                        <div className="text-xs text-gray-600">points</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>

                    <div className="space-y-2">
                      {challenge.requirements.map((req, i) => {
                        const progress = challenge.userProgress?.find(p => p.requirementType === req.type);
                        const isReqCompleted = progress?.completed || false;

                        return (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isReqCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className={`text-sm ${isReqCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                {req.description}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {progress?.current || 0}/{req.target}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Barre de progression globale */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{Math.round(percentage)}% complété</span>
                        {challenge.participantsCount > 0 && (
                          <span>{challenge.participantsCount} participants</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {selectedTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Boutique de récompenses</h3>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900">
                  {userStats?.availablePoints || 0} points disponibles
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => {
                const canAfford = (userStats?.availablePoints || 0) >= reward.cost;
                const isExpired = reward.availability.endDate && new Date(reward.availability.endDate) < new Date();

                return (
                  <motion.div
                    key={reward.id}
                    whileHover={{ scale: 1.03 }}
                    className={`bg-white rounded-lg p-5 border-2 ${
                      isExpired ? 'border-gray-200 opacity-50' :
                      canAfford ? 'border-blue-200 hover:border-blue-400' : 'border-gray-200 opacity-75'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{reward.icon}</div>
                      <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{reward.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Valeur:</span>
                        <span className="font-medium">{reward.value.description}</span>
                      </div>
                      {!reward.availability.permanent && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Disponibilité:</span>
                          <span className="font-medium text-orange-600">
                            {reward.availability.quantity ? `${reward.availability.quantity} restants` : 'Limité'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge de popularité */}
                    {reward.popularity > 50 && (
                      <div className="flex items-center justify-center gap-1 mb-3">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">
                          Populaire ({reward.purchasedCount} achats)
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setShowRewardModal(reward)}
                      disabled={!canAfford || isExpired}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        isExpired ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                        canAfford ? 'bg-blue-600 text-white hover:bg-blue-700' :
                        'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isExpired ? 'Expiré' :
                       canAfford ? `Acheter pour ${reward.cost} pts` :
                       `${reward.cost} points requis`}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {selectedTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-gray-900">Vos achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-5 rounded-lg text-white`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{achievement.icon}</div>
                    <h4 className="font-bold text-lg mb-2">{achievement.name}</h4>
                    <p className="text-sm opacity-90 mb-3">{achievement.description}</p>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-400 text-gray-900' :
                        achievement.rarity === 'epic' ? 'bg-purple-400 text-white' :
                        achievement.rarity === 'rare' ? 'bg-blue-400 text-white' :
                        'bg-gray-400 text-white'
                      }`}>
                        {achievement.rarity}
                      </span>
                      <span className="px-2 py-1 text-xs bg-white/20 rounded-full">
                        +{achievement.points} pts
                      </span>
                    </div>

                    <div className="text-xs opacity-75">
                      Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation d'achat */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRewardModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{showRewardModal.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirmer l'achat
                </h3>
                <p className="text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir acheter <strong>{showRewardModal.name}</strong> pour{' '}
                  <strong>{showRewardModal.cost} points</strong> ?
                </p>
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-blue-800 mb-1">
                    Votre solde actuel: {userStats?.availablePoints || 0} points
                  </div>
                  <div className="text-sm text-blue-800">
                    Solde après achat: {(userStats?.availablePoints || 0) - showRewardModal.cost} points
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRewardModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handlePurchaseReward(showRewardModal)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirmer l'achat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameDashboard;