/**
 * SYSTÈME D'ÉVALUATION COMPLET
 * Gère les notes et avis entre utilisateurs (locataires, propriétaires, agences)
 */

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Shield, Clock, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Rating {
  id: string;
  propertyId?: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  review: string;
  categories: {
    communication: number;
    cleanliness: number;
    reliability: number;
    overall: number;
  };
  isVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
  helpfulCount: number;
  response?: {
    content: string;
    createdAt: string;
  };
}

interface UserRatingStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  ratingsByCategory: {
    communication: number;
    cleanliness: number;
    reliability: number;
    overall: number;
  };
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verificationRate: number;
  responseRate: number;
  badges: string[];
}

interface RatingSystemProps {
  userId: string;
  userRole: 'tenant' | 'owner' | 'agency';
  propertyId?: string;
  readOnly?: boolean;
  showStats?: boolean;
  maxReviews?: number;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  userId,
  userRole,
  propertyId,
  readOnly = false,
  showStats = true,
  maxReviews = 10
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userStats, setUserStats] = useState<UserRatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    review: '',
    categories: {
      communication: 5,
      cleanliness: 5,
      reliability: 5,
      overall: 5
    },
    isAnonymous: false
  });
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'verified'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  useEffect(() => {
    loadRatingsAndStats();
  }, [userId, propertyId]);

  const loadRatingsAndStats = async () => {
    try {
      setIsLoading(true);

      // Charger les évaluations
      const ratingsResponse = await fetch(`/api/ratings?toUserId=${userId}${propertyId ? `&propertyId=${propertyId}` : ''}`);
      const ratingsData = await ratingsResponse.json();
      setRatings(ratingsData);

      // Charger les statistiques
      const statsResponse = await fetch(`/api/ratings/stats/${userId}`);
      const statsData = await statsResponse.json();
      setUserStats(statsData);

    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async () => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          toUserId: userId,
          propertyId,
          ...newReview
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      // Recharger les données
      await loadRatingsAndStats();

      // Réinitialiser le formulaire
      setNewReview({
        rating: 5,
        review: '',
        categories: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
          overall: 5
        },
        isAnonymous: false
      });
      setShowReviewForm(false);

    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const markHelpful = async (ratingId: string) => {
    try {
      await fetch(`/api/ratings/${ratingId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      // Mettre à jour localement
      setRatings(prev => prev.map(r =>
        r.id === ratingId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      ));

    } catch (error) {
      console.error('Failed to mark rating as helpful:', error);
    }
  };

  const submitResponse = async (ratingId: string, response: string) => {
    try {
      await fetch(`/api/ratings/${ratingId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ content: response })
      });

      // Recharger les données
      await loadRatingsAndStats();

    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  // Filtrer et trier les évaluations
  const filteredAndSortedRatings = ratings
    .filter(rating => {
      if (filter === 'positive') return rating.rating >= 4;
      if (filter === 'negative') return rating.rating <= 2;
      if (filter === 'verified') return rating.isVerified;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    })
    .slice(0, maxReviews);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques de l'utilisateur */}
      {showStats && userStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Note globale</h3>
            {userStats.badges.length > 0 && (
              <div className="flex gap-1">
                {userStats.badges.slice(0, 3).map((badge, i) => (
                  <Award key={i} className="w-5 h-5 text-yellow-500" />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Note moyenne */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {userStats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(userStats.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">
                {userStats.totalRatings} évaluation{userStats.totalRatings > 1 ? 's' : ''}
              </div>
            </div>

            {/* Distribution des notes */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = userStats.ratingDistribution[stars as keyof typeof userStats.ratingDistribution];
                const percentage = userStats.totalRatings > 0 ? (count / userStats.totalRatings) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-3">{stars}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Catégories */}
            <div className="space-y-3">
              {Object.entries(userStats.ratingsByCategory).map(([category, rating]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {category === 'communication' && 'Communication'}
                    {category === 'cleanliness' && 'Propreté'}
                    {category === 'reliability' && 'Fiabilité'}
                    {category === 'overall' && 'Général'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges et vérifications */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {userStats.verificationRate}% vérifié
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  {userStats.responseRate}% de réponse
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Mis à jour aujourd'hui
            </div>
          </div>
        </motion.div>
      )}

      {/* Formulaire d'ajout d'évaluation */}
      {!readOnly && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Évaluations ({filteredAndSortedRatings.length})
          </h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showReviewForm ? 'Annuler' : 'Ajouter une évaluation'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h4 className="font-semibold text-gray-900 mb-4">Rédiger une évaluation</h4>

            {/* Note globale */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note générale
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= newReview.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Catégories */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(newReview.categories).map(([category, rating]) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {category === 'communication' && 'Communication'}
                    {category === 'cleanliness' && 'Propreté'}
                    {category === 'reliability' && 'Fiabilité'}
                    {category === 'overall' && 'Général'}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            [category]: star
                          }
                        }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Commentaire */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire détaillé
              </label>
              <textarea
                value={newReview.review}
                onChange={(e) => setNewReview(prev => ({ ...prev, review: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Décrivez votre expérience..."
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newReview.isAnonymous}
                  onChange={(e) => setNewReview(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Anonyme</span>
              </label>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={!newReview.review.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publier l'évaluation
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres et tri */}
      {ratings.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrer:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Toutes</option>
              <option value="positive">Positives (4-5⭐)</option>
              <option value="negative">Négatives (1-2⭐)</option>
              <option value="verified">Vérifiées</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Trier:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="recent">Plus récentes</option>
              <option value="helpful">Plus utiles</option>
              <option value="rating">Mieux notées</option>
            </select>
          </div>
        </div>
      )}

      {/* Liste des évaluations */}
      <div className="space-y-4">
        {filteredAndSortedRatings.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune évaluation pour le moment</p>
          </div>
        ) : (
          filteredAndSortedRatings.map((rating) => (
            <motion.div
              key={rating.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              {/* En-tête de l'évaluation */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {rating.isAnonymous ? '?' : 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {rating.isAnonymous ? 'Utilisateur anonyme' : 'Utilisateur'}
                      </span>
                      {rating.isVerified && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < rating.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {rating.rating}/5
                  </span>
                </div>
              </div>

              {/* Catégories */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {Object.entries(rating.categories).map(([category, catRating]) => (
                  <div key={category} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {category === 'communication' && 'Comm.'}
                      {category === 'cleanliness' && 'Propreté'}
                      {category === 'reliability' && 'Fiabilité'}
                      {category === 'overall' && 'Général'}
                    </div>
                    <div className="flex justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < catRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Commentaire */}
              <p className="text-gray-700 mb-4">{rating.review}</p>

              {/* Réponse du propriétaire */}
              {rating.response && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">P</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Réponse du propriétaire
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(rating.response.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{rating.response.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => markHelpful(rating.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Utile ({rating.helpfulCount})
                  </button>
                </div>

                {/* Bouton de réponse (pour le propriétaire) */}
                {!readOnly && !rating.response && userRole === 'owner' && (
                  <button
                    onClick={() => {
                      const response = prompt('Répondre à cette évaluation:');
                      if (response?.trim()) {
                        submitResponse(rating.id, response.trim());
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Répondre
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingSystem;